<!--{"name":"Ada","icon":"mask","active":true,"desc":"Integrated Web Framework","index":0,"commentId":"1"}-->

[![Build Status](https://travis-ci.org/topolr/ada.svg?branch=master)](https://travis-ci.org/topolr/ada)
[![npm version](https://badge.fury.io/js/adajs.svg)](https://badge.fury.io/js/adajs)
[![npm](https://img.shields.io/npm/dt/adajs.svg?maxAge=2592000)](https://www.npmjs.com/package/adajs)
[![license](https://img.shields.io/github/license/topolr/ada.svg?maxAge=2592000)](https://github.com/topolr/ada/blob/master/LICENSE)

## 一体式框架

- **面向工程**
 - 落脚于工程整体而不是工程的某一方面
 - 提供工程的"一站式"解决方案 
- **按需集成**
 - 只集成对整体有意义的特性，使整体效能最大化
- **开箱即用**
 - 针对特性的使用可以进行最大程度的简化，使使用门槛降到最低
- **整体优化**
 - 任何特性都是基于整体的具体情况而实现，目标纯粹
 - 对集成的特性可以在整体上进行统一优化，使特性本身及整体效率最大化
- **统一控制**
 - 任何特性都作为整体的一部分而加以实现，不受任何第三方的控制
 - 针对问题的处理可以实现快速响应

## 面向结构编程

当面向组件编程([component-based programming](https://en.wikipedia.org/wiki/Component-based_software_engineering))及响应式编程([reactive programming](https://en.wikipedia.org/wiki/Reactive_programming))已深入开发实践，组件协同结构的设计便越发重要，而支持组件协同结构的设计需要引入并实现一些规约，这便是Ada。

响应式编程强调实体关系的描述,面向组件的设计则重在结构的划分和复用，强调整体与局部的系统关系,Ada则强调在此基础上的协同结构的设计。

### 黑盒组件

<div class="ada-module" data-type="entries/image.js" data-option='{"url":"docs/images/view.svg"}'></div>

组件是黑盒的，外部无需关心组件的具体实现和行为方式，组件本身也无需关心和了解所处的环境。组件状态唯一的管理者是组件自身，外部只能够通过特定的通信渠道与组件产生作用，组件也只能依靠消息机制向外发送反馈。

- **组件是精确响应式的**
- **组件是具备完整功能的个体，它由模版(template)，样式(style)，状态管理器(DataSet)和控制器(Controller)组成。它在没有任何数据注入的情况下必须一致可用。**
- **组件资源是相互隔离的以便于继承复用**
- **组件状态的修改是唯一通过其数据管理器完成的，其他任何位置都可不修改。**
- **组件是由其他组件创建的，应用只有一个预创建的根组件，创建组件的组件称为父组件，被父组件创建的组件为该组件的子组件**
 - 父子组件在创建子组件后会创建唯一一条**单向**(从父到子)的消息管道
 - 父组件中的数据会通过该信道传递给子组件，且不可被任何位置程序修改
 - 当父组件中其传递出去的数据有变化，子组件会接到更新请求并通过自身的数据处理逻辑决定是否更新自身状态
- **组件DOM和style具有隔离特性，组件只能操作自己的DOM，组件样式不会影响其他组件样式**

> 组件的状态包括缓存数据和模版数据，模版数据的"修改"会引起组件重新渲染，缓存数据则不会。Ada中所有的数据都是[Immutable data structures](https://en.wikipedia.org/wiki/Immutable_object)，不存在实际修改而是新对象的生成并保持原生APIs

```javascript
import {view,View} from "adajs";
import LoadingService from "./state.js";

@view({
    className:"loading",
    template:"./template.html",
    style:"./style.scss",
    dataset:{
    	service:LoadingService
    }
})
class Loading extends View{
}

export default Loading;
```

### 连接器

连接器是一种特殊的组件，它可以跨越父子关系获取到任何祖先组件中的数据并分发，因此它并非黑盒的，它需要显式声明依赖。

- **主动获取其他组件的数据(非父子传递)，连接器组件由于产生非自然结构(父子结构)的依赖，其可复用性变差。**
- **连接器组件会与数据提供组件间创建一条唯一的单向(从数据提供者到消费者)消息管道，当提供数据的组件有变化就会通知该连接器组件以重新计算新状态。**
- **连接器组件不具备自己的单独的数据管理器(DataSet),因为其自身便是一个数据管理器**
- **连接器组件核心功能是跨层级获取数据并处理分发，其余组件功能将大幅度弱化**

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
}

export default Connector;
```

### 消息管道

<div class="ada-module" data-type="entries/image.js" data-option='{"url":"docs/images/process.svg"}'></div>

- **消息管道是响应式的**
- **消息管道是依赖一定数据的**
- **消息管道是单向的，固定组件间的管道是唯一的**
- **消息管道发生通信的唯一原因是其关联的数据发生变化**
- **消息管道通知给关联组件进行状态更新，所有的关联组件及自身都更新完毕，整个数据更新过程才结束。关联组件的状态更新是组件更新的一部分。**

### 通信和反馈

<div class="ada-module" data-type="entries/image.js" data-option='{"url":"docs/images/passable.svg"}'></div>

- **外界可以也只能通过消息管道注入数据(消息)以期待组件可以产生某些变化(是否以及如何变化取决于组件本身)，但固定的注入一定会有一致的结果。**
- **外界可以也只能通过组件暴露的方法获取组件的状态，外界不能直接修改组件的状态。**
- **组件只能通过自身的事件机制来**主动**向外传递消息**

### 生命周期

<div class="ada-module" data-type="entries/image.js" data-option='{"url":"docs/images/life.svg"}'></div>

- **oncreated** `View`对象被创建完成，`dom`可用
- **onready** 资源都可用
- **onbeforecommit** `commit`前调用
- **oncommited** `commit`完成后调用
- **onupdated** `View`被重新渲染后
- **onchildadded** 当有新子组件被创建并`ready`后
- **onchildremoved** 当子组件`onunload`后
- **onunload** 组件卸载资源释放后
- **onrecover** 组件从镜像中恢复时调用

> `onbeforecommit`,`oncommited`是`commit`前后调用，初始化时实际是调用`commit()`所以在`ready`前会触发这两个回调，所以需要注意View状态。`onupdated`未必会在`commit`后调用，只有实际发生view渲染后猜会被调用。

## 分层架构

Ada代码是分层的，每个层面各司其职，每个层面也是独立的拓展点。

- **模版&样式层** 定义组件模版和样式
- **数据处理层** 定义组件的数据处理逻辑
- **逻辑控制层** 定义组件的控制逻辑

## DDM

DDM(Data DOM Mapping),数据通过一定的模版与DOM一一对应，一定的数据传入一定产生一个固定的DOM状态。Ada使用字符串模版引擎来实现。

<div class="ada-module" data-type="entries/image.js" data-option='{"url":"docs/images/ddm.svg"}'></div>

- **缓存数据** Ada的DDM是`diff`的，所以在状态树中会缓存数据
- **代理DOM事件** Ada的DDM会处理任何类型的事件代理
- **依赖收集** Ada的DDM会收集模版依赖的数据，以供精确响应式处理
- **DOM更新** Ada的DDM会通过`diff`算法生成最小的DOM的操作工序来更新DOM状态
- **DOM搜索隔离** Ada的DDM会隔离不同组件间的DOM查询，以保证组件的黑盒特性

## 构建打包与加载器和模块管理器

- **资源构建**
 - 针对不同类型资源使用常规构建方式
- **资源打包**
 - Ada的数据打包方式是使用`原样`打包(构建后直接打包)以最大程度缩减文件体积
 - Ada使用粒度文件(单文件)和整包(合并)文件输出
- **资源本地缓存与增量更新**
 - Ada会将控制的资源缓存到本地(memory->localStorage->IndexDB)
 - Ada获取资源时首先请求本地缓存以避免请求(HTTP Cache)带来的开启HTTP连接的性能损耗
 - Ada对所控资源有版本追踪能力，只获取有变化的数据
 - Ada的代码粒度已经在逻辑上保持最小，Ada会根据更新数量和粒度权衡加载整包或粒度文件
- **增强代码的自省能力**
 - Ada的构建流程中会在代码中加入额外的有用信息，以增强代码的自省能力

> Ada使用专门定制的构建打包工具`ada-pack`来完成预处理流程，并使用定制的加载器和模块管理器完成运行时的支持。

## HMR

- "静默"非侵入式
 - 得益于Ada定制的构建器加载器和模块管理器的相互配合，Ada的HMR是非侵入式的，无需额外的代码干预
 - Ada会追踪任何资源的变动，并根据不同的资源类型来区别更新
- 使用`SSE`(server send event)来实现与客户端的通信
 - Ada使用简单的SSE来实现开发时HMR更新通信
- 发布为基础功能
 - Ada的HMR可以作为基础功能打包，这样可以调用这些API来实现应用真正的无感更新

## SSR

- **镜像与恢复**
 - 镜像是指应用的某一时刻的状态，ada通过上下文的唯一方法snapshot()来实现状态的持久化
 - ada能自动从任何镜像恢复到应用的运行时状态，使应用继续正确运行
- **真正的代码同构**
 - ada的代码中未引入任何新式语法，合法的es6代码就可以正常运行
 - 对于样式，任何的纯css语法都是被支持的
- **多种渲染方式**
 - 可以直接通过引用ada类的方式直接渲染
 - 可以从dist目录对构建后的代码进行渲染
- **支持多核渲染**
 - ada的渲染都是依赖一定的渲染上下文的，上下文可以共享也可以独立运行
- **零配置零代价**
 - 无需任何配置就可以开启服务端渲染，只需调用渲染方法
 - 无需为服务端渲染而做任何特别的工作，比如事先准备好数据这样的事

## Time-Travelling

- Ada的数据是Immutable的
- 内置`Transition DataSet`用于维护和实现状态的变化

## 入口文件与PWA

<div class="ada-module" data-type="entries/image.js" data-option='{"url":"docs/images/pwa.svg"}'></div>

- 去除`index.html`应用入口文件，并提取必要特性作为配置
- 合并`develop`,`publish`配置
- 合并`manifest`
- 合并`service worker`代码
- 统一于`app.js`中，构建时一并生成各种资源

