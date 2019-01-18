<!--{"name":"API","icon":"dropbox","active":false,"desc":"Integrated Web Framework","index":2,"commentId":"3"}-->

## 模板

Ada DDM所使用的是字符串模板引擎，首次渲染是使用html字符串直接填充DOM，此外都是基于`diff`使用DOM APIs去动态修改DOM。该模板引擎有以下简单使用原则

- 任何标签的标签属性、标签体都可以使用赋值语法
- 标签属性分为输出属性和非输出属性，非输出属性用`@`开头，它不会最终作用到DOM上，同时其可以接受非简单类型数据。
- 事件使用`on`开头+事件名来绑定，其属于非输出属性
- 模板语法其间的纯html不能存在不闭合的结构

### 基本语法

1.赋值

```html
<div>{{ value }}</div>
```
> 注意{{空格value空格}}空格，以避免与指令冲突。

2.遍历数组

```html
{{list data as item index}}
    <div>code...</div>
{{/list}}
```
3.遍历对象

```html
{{map object as value key}}
    <div>code...</div>
{{/map}}
```
4.条件

```html
{{if data}}
    <div>a</div>
{{elseif aa='cc'}}
    <div>c</div>
{{else}}
    <div>b</div>
{{/if}}
```
5.log

```html
{{log data}}
```
6.设置变量

```html
{{set a='aaa'}}
```
7.break

```html
{{list list as item}}
    {{if item.name==='aa'}}
        {{break}}
    {{/if}}
{{/list}}
```
> break只能放到list或者map中使用。

8.标签属性

- 输入到标签中的属性`property="value"`，与HTML标准一致
- 缓存到DDM中的属性`@property="value"`，可以将对象进行缓存，并且不会输出到标签

### assign directives (赋值指令)

赋值指令是赋值语法的拓展，语法为`{{directiveName value}}`，赋值指令是一个返回html的函数，它接受赋值变量的值。它为了简化处理单值运算而设计。

> 这里需要注意一定要避免XSS的问题

```javascript
function (data) {
    return '<br/>';
}
```

定义全局赋值指令

```javascript
import {DDM} from "adajs";

DDM.setDefaultAssignDirective(diretiveNam,function() {
  //code...
});
```

默认全局赋值指令

- `{{html htmlcode}}` 输出html片段

### macro(宏)

DDM模板支持自定义指令`<@macroName/>`或`<@macroName><@macroName/>`，自定义指令是一个函数。

```javascript
function({bodyStr, props, events, attrs}) {
    return {template, data: {}};
}
```
它接受`bodyStr`，即非单标签使用时标签内部的字符串；`props`标签非显示属性；`attrs`标签显示属性；`events`标签绑定的事件。它返回一个新的模板和依赖数据。

定义全局指令

```javascript
import {DDM} from "adajs";

DDM.setDefaultMacro(macroName,function() {
  //code...
});
```
默认的全局指令

- `<@self/>` 递归调用

### 自定义标签

```html
<div>
    <div>hello down</div>
    <hello class="aa" data-value="aa"></hello>
</div>
```
自定义标签首先从局部定义中检查是否定义，再从全局检查，最后检查是否为合法的浏览器支持标签。

- 从View`tags()`方法中定义局部自定义标签，只在View的模版中生效
- 使用`DDM.setDefaultTag(name, generator)`方法定义全局自定义标签，但可能被局部定义覆盖

```javascript
DDM.setDefaultTag("icon", {
    template({attrs}) {
        return `<svg class="${attrs.class || "ada-icon"}"><use xlink:href="#${attrs.id}"></use></svg>`;
    }
});
```

默认全局自定义标签

- `<icon id=""/>` 通过传入的`id`输出一个svg图标
- `<module></module>` 解析一个匿名组件

> 自定义标签是通过宏实现的,它是宏的语法糖

### 自定义函数

```html
<div class="{{ classname(data,['head','close','scroll']) }}" data-find="header"></div>
```
参数：
- data
 - 模版数据
 - 属性数据，当模版数据中该属性值为`true`则将该属性添加到`classList`，否则不加

定义全局函数

```javascript
import {DDM} from "adajs";

DDM.setDefaultFunctions(fnName,function() {
  //code...
});
```
默认的全局函数

- `classname()` 用于处理复杂class name生成

## 注解

Ada中用元数据的方式来标识类或者类方法来达到一定的目的。

### view
ada中的View是带指定注解的普通JavaScript类，带view注解的类是才能够被ada解析成可用类。view注解会接受一个对象作为元数据。

```javascript
@view({
    tagName:"",//全局配置tagName，全局可用
    className:"",//view的DOM的class值，任何带该值的view会对其关联的style(css)进行基于class的“隔离处理”
    template:"<filepath>",//该view关联的模板
    style:"<stylepath>",//该view关联的样式
    dataset: {
        service: Service,//action处理类
        dataset: DataSet//数据集处理器类
    }
})
```

### root
root注解除了注解名与view不同外，其他与view注解相同。一个ada项目中只能有一个标示为root的类作为启动类，多个标识为root的view会以最后载入的为准。

```javascript
@root({
    className:"",
    template:"<filepath>",
    style:"<stylepath>"
})
```
###  binder
binder注解是作用于类方法的，它表示该方法可能会被模板中的某个事件调用

```javascript
@binder("name")
```
比如在模板中可能存在这样的代码

```html
{{list list as item}}
    <div class="test" onclick="{{test(item)}}">{{item.name}}</div>
{{/list}}
```
其中`onclick="{{test()}}"`则表示当该元素被点击时会调用模板关联类中被标识为`@binder("test")`的类方法调用，如果不存在则不会被处理

那么在类中可能会存在这样的代码

```javascript
@view({
    className:"test",
    template:"",
    style:""
})
class Test extends View{
    constructor(parameters){
        super(parameters);
        this.render();
    }

    @binder("test")
    test({e,item}){
        console.log("-----clicked----",item);
        e.stopPropagation();
    }
}
```
其中被标识为binder的方法其参数对一个对象，其中包括`event`事件对象，以及参数对象，用解构的写法更佳

###  handler
handler是用来标识view间传递事件的监听函数，其中name为事件名。

```javascript
@handler("name")
```

###  action
action是`Service``中注解，用来标识服务处理函数

```javascript
@action("name")
```
```javascript
import {action,Service} from "adajs";

class TestService extends Service{
    constructor(parameters){
        super(parameters);
    }

    @action("test")
    test(){
        return Promise.resolve({"aa":"aa"});
    }

    @action("testsync")
    testSync(){
        return {"aa":"aa"};
    }
}
```

### subscribe

Dispatcher类的回调

```javascript
import {binder, View, view, subscribe} from "adajs";
import dispatcher from "./../../dispatcher";

@view({
	className: "pagemenu",
	template: "./template.html",
	style: "./style.scss"
})
class Pagemenu extends View {
	oncreated() {
		dispatcher.observe(this);
	}

	@subscribe("scroll")
	scroll() {
		let top = (window.document.scrollingElement || window.document.body).scrollTop;
		if (top > 120) {
			this.unobserve(this);
		}
	}
}

export default Pagemenu;
```

## 内置类

### DDM对象

DDM对象中的方法主要用于获取DOM信息的，这其中包括DOM隔离问题。DOM隔离是避免跨DDM获取DOM越界，不能够直接使用DOM查询APIs进行DOM获取，如果这样很容易的就会穿越组件DDM的界限，导致处理组件界外元素的可能，而应该优先使用DDM提供的方法获取DOM元素。

**finder(name) → MapDom**

- `name`String - finder名

如果在模板中定义了这样的片段

```html
<div>
    <div class="test" data-find="test"></div>
</div>
```

当view`onready`，这个代码片段将被渲染到DOM中，此时试图获取div.test这个元素，可能有下面的方式：

```html
let element=[...this.getElement().querySelectorAll("test")][0];
```
或者

```html
let element=this.getDDM().finder("test").getElement();
```
第一种情况可能引入view的DOM越界，获取到了其他view中的元素，这很不安全，第二种则放心使用，它可能会获取到该view中的具有`data-find`属性的元素。

DDM可以缓存数据，也就是那些标签上非显示的属性，获取他们只能通过DDM的api

```html
this.getDDM().finder("test").getAttributes();
```

**finders(name) → [MapDom]**

- `name`String - finder名

这个方法是获取所有标识`data-find`属性的标签，finder则是只获取第一个

**group(name) → MapDom**

- `name`String - group名

这个方法是获取第一个标识`data-group`属性的标签

**groups(name) → [MapDom]**

- `name`String - group名

这个方法是获取所有标识`data-group`属性的标签，只获取第一个

### MapDom

DDM与DOM的映射对象，他们彼此一一对应，DDM携带更多的缓存信息。

**getAttributes() → {}**

获取所有的非显示属性对象

**getAttribute(propName) → {}**

- `propName`String - 属性名

根据非显示属性名获取值

**getEventInfo() → {}**

获取该元素绑定的事件信息

**isListenedEvent(type) → boolean**

- `type`String - 事件名

判断该元素是否监听了某事件

**getElement() → DOM**

根据该DDM映射对象获取真实DOM元素

**groupi(name = "") → [MapDom]**

- `name`String - groupi名

获取所有该元素下标识`data-group`属性的标签元素

### View

view是框架的基类

**getDataSets() → DataSet**

获取该view的DataSet对象

**onunload()**

view被移除时的回调函数，用于处理view的善后工作，view的移除是基于DOM的，当view从文档中被移除该view就认为被移除，这个过程是全局有效的，即使view并不是使用view提供的移除方法移除的。

```javascript
onunload(){
    clearInterval(this._interval);
}
```
**onupdated()**

当view的DOM更新完成时调用

> view的DOM未必在每次提交时都会更新，因为提交更新请求未必影响DOM更新，只有影响到模版使用的属性修改，DOM才会更新

**getElement()**

获取该view所在DOM的element，这很有用，你可以把这个view变成完全的基于DOM APIs的view

```javascript
constructor(parameters){
    super(parameters);
    [...this.getElement().querySelectorAll(".test")].forEach(element=>{
        let a=document.createElement("div");
        a.setAttribute("class","subtest");
        element.appendChild(a);
    });
}
```

**getDDMContainer()**

获取DDM所在的element，当然这往往就是view所在的element，除了BondViewGroup类，因为这个类需要隔离DDM和DOM操作

**getDDM() → DDM**

获取该view内的DDM对象

```javascript
someViewMethod(){
    let containerElement=this.getDDM().finder("container").getElement();
    console.log(containerElement);
}
```

**getParent() → View**

获取view父容器对象

**getId() → String**

获取view的id，每一个view都会有一个唯一id

**isRemoved() → boolean**

判断该view是否被移除，很多时候view会被糟糕的逻辑缓存比如引用，当该view被移除后仍旧使用那么这个方法就很有用了。

**dispatchEvent(type, data, isdefault = true)**

view分发事件的方法，`type` 为事件类型，`data`为传递的数据，`isdefault`为传播方法，当为`true`时为向上分发反之则向子view传递

**getCurrentState() → Object**

该方法返回数据集的数据

**className → ClassNames**

获取该view的类全名，模块路径加class名

**getElementClassName(className = "") → String**

如果view被注解了className那么其模板会对标签的class属性进行特殊处理，将任何模板中的class值添加前缀，前缀为该类className定义的值，那么在view中使用class名时就需要特殊处理才是最终的值，这个方法帮助获取最终class值。

**getName() → String**

返回view传入的`name`值

> `name`应该在统一父元素下保持唯一

**oncreated()**

当view实例创建完成时，此时模版没有被渲染，容器DOM ready，该回调可以返回`Promise`用于织入异步逻辑

**onready()**

当view模版渲染完成时，子view都ready，该回调可以返回`Promise`用于织入异步逻辑

**onbeforecommit()**

当`DataSet`的`commit`方法调用前，该回调可以返回`Promise`用于织入异步逻辑

**oncommited()**

当`DataSet`的`commit`方法执行完后，该回调可以返回`Promise`用于织入异步逻辑

**update(data) → Promise**

- `data`Object - 数据

更新view

> 该方法不应该被主动调用（StaticViewGroup除外），因为view是响应式的，应该更多关注数据处理

**commit(type, data) → Promise**

- `type`String - `action`名
- `data`Object - 数据

提交数据状态更新操作

**tags() → Object**

这是一个需要`override`的方法，需要返回用于模版处理的标签名与具体View类的映射

**isRendered()**

判断view是否已经进行了首次渲染


### ViewConnector

数据连接器类

**setContextDataSets(connect) → Object**

- `connect(DataSet,getter,setter)`Function - 连接器函数
  - `DataSet`DataSet - 指定`DataSet`类型，用于筛选
  - `getter(state)`Function - 获取指定数据
   - `state`Object - 被连接状态的状态
  - `setter(data)`Function - 根据传入值生成新的状态
   - `data`Object - 新状态(getter逻辑返回的)

用于定义数据连接，并返回新状态，它可以相应被连接view所用状态的修改

```javascript
import {view, ViewConnector} from "adajs";
import Reply from "./../reply";
import ContainerService from "./../container/state";

@view({
    className: "connector",
    template: "./template.html",
    style: "./style.scss"
})
class Connector extends ViewConnector {
    setContextDataSets(connect) {
        let userInfo = connect(ContainerService, current => {
            return current.userInfo;
        }, (current, data) => {
            current.userInfo = data;
        });
        return {userInfo, commentId: ""};
    }

    onupdate(current, data) {
        current.commentId = data.commentId;
        return current;
    }

    tags() {
        return {
            reply: Reply
        }
    }
}

export default Connector;
```

**onupdate(current, data) → Promise|Object**

- `current`Object - 当前状态
- `data`Object - 更新参数

当有数据操作情况时调用，即view外部调用`view.update(data)`时的回调，它可以返回新状态或者Promise，但Promise需要返回最终状态

**getCurrentState() → Object**

**update(data) → Promise**


### ViewGroup

ViewGroup的模板拥有添加子组件的能力，所以子组件的处理是基于DDM自动完成的，而且管理子组件也只能通过维护数据的方式完成。

> ViewGroup extends View

**tags()**

用于定义该view模版中的自定义标签配置，系统会首先以局部配置为准再去全局获取配置

**onchildremoved()**

当子组件被移除时调用，该回调可以返回`Promise`用于织入异步逻辑

**onchildadded()**

当有子组件被添加时调用，该回调可以返回`Promise`用于织入异步逻辑

**getChildAt(index = 0) → View**

- `index`Int - view下标

安索引获取子view

**getChildByType(type) → View**

- `type`View - view类

安子view类型获取子view

```javascript
import {ViewGroup} from "adajs";
import Subview from "./subview.js";

class ParentView extends ViewGroup{
    constructor(parameters){
        super(parameters);
        this.render();
        let subview=this.getChildByType(Subview);
    }
}
```

**getChildren() → [View]**

获取所有子view

**getChildByName(name) → View**

- `name`String - view的name值

获取具有name的view实例


### StaticViewGroup

StaticViewGroup的模板没有管理子组件的能力，所以它的子组件只能够通过自身的API来完成，是手动的。好处就是比较灵活，省去维护一些没有实际意义的状态的浪费。

> StaticViewGroup extends ViewGroup extends View

**addChild(type = null, {option = {}, container = null, attrs = {}, override = {}, data = {}} = {}) → Promise**

添加子view，`type`为子组件的构造函数，`option`为子组件初始化的选项，`container`添加子组件所在的element，默认为document.body，`attrs`子组件标签属性。`override`运行时覆盖实例属性（方法） `data`传递给组件的数据。

```javascript
import {ViewGroup} from "adajs";
import Subview from "./subview";

class Group extends ViewGroup{
    constructor(parameters){
        super(parameters);
        this.addChild(Subview,{
            container:this.getElement()//将Subview添加到组件内部DOM中
        });
    }
}
```
**removeChild(view)**

- `view`View - view实例

根据子组件实例去除子组件

**removeChildAt(index = 0) → View**

- `index`Int - view下标

根据子组件下标去除子组件

**removeAllChild()**

清空所有子组件

**removeChildByType(type)**

- `type`View - view类

根据子组件构造函数去除子组件

**removeChildByName(name)**

- `name`String - view的name值

删除具有name的view


### BondViewGroup

BondViewGroup是“混合”管理子组件的，它会在内部分割出一块区域专用做DDM管理子组件，一个区域用于手动管理。

> BondViewGroup extends ViewGroup extends View



### DataSet

数据集合，它可以管理多个订阅者，并在某一个订阅者触发数据处理后将结果分发给所有订阅者。它只能通过注解声明式创建，并决定是否按组件树向下传递，任何的声明使用该类型对象的子组件都会被注入该对象，实现共享。数据处理逻辑由Service类提供，并且可以被分片aspect拦截。

**commit(type, data) → Promise**

- `type`String - `action`名
- `data`Object - `action`参数

提交`DataSet`更新请求

**getData() → object**

获取数据集当前的数据

**toggleService(serviceClass)**

- `serviceClass`Service - `Service`类

切换view`DataSet`的`Service`类

切换数据处理类

**getComputeData(name) → object**

- `name`String - `compute`注解名

返回`DataSet`计算值



### TransactDataSet

事务型数据集，可以保存提交的数据操作

** getTransactionList() → []**

获取数据操作集合

** rollback(step) → Promise**

回滚

** travel(step = 0) → Promise**

将值切换到其中某一步操作后



### Service

数据处理类

**defaultData() → object**

需要覆盖该方法以提供默认值

**onupdate(current, data) → Promise|object**

- `current`Object - 当前状态
- `data`Object - 传入的`action`参数

当有数据操作情况时调用，即view外部调用`view.update(data)`时的回调，它可以返回新状态或者Promise，但Promise需要返回最终状态


### Dispatcher

事件发送类

** observe(view) **

添加view

** unobserve(view) **

删除view

** dispatch(type,data) **

分发消息



### Modules

ada全局模块管理器，可以用来导入，遍历，获取等操作。

**excute(path)**

导入指定模块

**scan(fn)**

遍历所有的模块

**scanClass(fn)**

遍历所有的JavaScript类

**filter(fn)**

过滤所有载入的模块

**get(path) → {}**

获取已经导入的模块

**has(path) → boolean**

是否包含指定的模块

**set(path, _exports)**

设置模块，它可以运行时手动添加或者修改模块，但它不会音响已经导出的模块。



### DDM

**static setDefaultMacro(key, fn)**

设置DDM模板全局macro

```javascript
import {DDM} from "adajs";
DDM.setDefaultMacro("test",function() {
  //code...
});
```

**static setDefaultAssignDirective(key, fn)**

设置全局指令

**static setDefaultFunctions(name, fn)**

设置全局函数

**static setDefaultTag(name, generator)**

设置全局标签


### Passable

生成Immutable数据，以便保护性传递。被保护的数据不能够直接修改，需要在生成器函数中处理，然后生成新的数据，被保护数据保持不变，相同结构得到共享。

**constructor(data)**

- `data`Object - 被保护的数据

**pass(fn, parameter = {}, scope = {})**

- `fn`Function - 生成器函数，用于处理Imuutable数据，生成新的数据
- `parameter`Object - 传递给生成器函数的参数
- `scope`Object - 生成器函数的上下文

用于处理并生成新的数据

**static get(data) → Passable**

- `data`Object - 被保护对象

用于创建Passable的静态函数


### util

Ada暴露的工具函数

**randomid(leng) → String**

- `leng`Int - 字符串长度

返回唯一字符串

**hashCode(str) → String**

- `str`String - 字符串

获取已知字符串的hashcode

**isString(object) → Boolean**

- `object`Object - 传入值

判断传入值是否为字符串

**isFunction(object) → Boolean**

- `object`Object - 传入值

判断传入值是否为函数

**isEqual(a,b) → Boolean**

- `a`Object - 传入值
- `b`Object - 传入值

判断两个传入值是否相等，深度比较

**isObject(object) → Boolean**

- `object`Object - 传入值

判断传入值是否为对象

**isPlainObject(object) → Boolean**

- `object`Object - 传入值

判断传入值是否Plain对象

**isArray(object) → Boolean**

- `object`Object - 传入值

判断传入值是否为数组

**isQueryString(object) → Boolean**

- `object`Object - 传入值

判断传入值是否为url query字符串

**excuteStyle(styleCode)**

- `styleCode`String - 样式字符串

使传入样式字符串生效

**encodeHTML(str) → String**

- `str`Object - html字符串

encode html字符串

**extend([boolean]...Object) → Object**

- `object`Object -

与`jquery.extend()`相同

**clone(object) → Object**

- `object`Object - 待clone对象

深克隆对象


## Context

上下文对象，提供所需的全局资源。也是渲染器隔离的保证。

- **request** 提供http请求的对象
- **config** 全局配置
- **window** 当为浏览器时，为`window`对象
- **document** 当为浏览器时，为`document`对象
- **snapshot()** 生成镜像
- **hook()** 设置全局钩子
- **unhook()** 取消全局钩子
 
## SSR支持

ada提供`adajs/server`入口，并提供`Renderer, DistRenderer, DistSteamRenderer`3个实现类

### Renderer

同构代码渲染器

- **getCurrentHTML()** 获取当前应用状态的html字符串
- **getRootView(view, parameters = {})** 获取应用根组件

### DistRenderer

dist目录代码渲染器

- **outputURL(url)** 输出指定url的字符串，应用状态取决何时调用`snapshot()`
- **outputURLs([url])** 

### DistSteamRenderer

dist目录代码渲染器，并以`steam`方式输出

- **outputStream(url)** 输出指定url的字符串流，应用状态取决何时调用`snapshot()`

## 全局函数

全局函数只是代码中全局可用的函数，只有一个imports，用于异步引用模块的。

### import(modulePath) => Promise

### 入口文件

- 正常情况下，如果ada代码不进行ada-pack的处理，则所有的资源(可以Map到的)都是异步引入的
- 经过ada-pack处理的代码，会根据“情况”来决定是从压缩包还是从单个文件中获取资源
- 为了避免首屏压缩包(主入口文件的依赖)过大，则需要将辅助的资源进行合理划分，避免交叉引用，然后再异步引入
- app.js可以指定主入口和子入口文件夹(将其中的文件都作为子入口)，其他的没有被依赖的文件可以配置为作为子入口(默认开启)也可以舍弃(只保留有依赖的文件，没被依赖的将不被引入)
- Ada提供`import`方法异步引入模块，更多的时候它用来引入入口模块或者必须保证这些被异步引入的模块没有被上一步舍弃，模块必须被Map到才可以