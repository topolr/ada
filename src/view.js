let Metadata = require("./lib/metadata");
let { DDM, MapDom } = require("./base/ddm");
let { getDataSetFromParent, isFunction, isPropsChange, isPropsChangeEqual, protectData, randomid, setProp } = require("./util/helper");
let {
    BINDERS,
    CHANGEPROPS,
    CHILDRENTAG,
    CLASSNAME,
    CONNECTS,
    CONNECTSTATE,
    DATASET,
    DDMCONTAINER,
    DDMTAG,
    ELEMENTTAG,
    HANDLERS,
    IDNAME,
    ISREMOVED,
    OUTERVIEW,
    PARENTVIEWTAG,
    PREREMOVED,
    SUBSCRIBE,
    USEPROPS,
    VIEWINFO,
    VIEWNAME,
    MODULEPATH,
    VIEWTAG,
    CONTEXT,
    OBSERVERS
} = require("./util/const");
let { DataSet, DataSetHelper } = require("./dataset");
let Collector = require("./base/collector");
let { ViewHadRemovedError } = require("./util/error");

const macros = {
    module({ bodyStr, props, events, attrs }) {
        let r = [`data-module=""`];
        Reflect.ownKeys(attrs).forEach(attr => r.push(`${attr}="${attr}"`));
        let template = `<div ${r.join(" ")}>${bodyStr}</div>`;
        return { template, data: props };
    }
};
const tags = {
    module: {
        template({ bodyStr, props, events, attrs }) {
            let r = [`data-module=""`];
            Reflect.ownKeys(attrs).forEach(attr => r.push(`${attr}="${attr}"`));
            return `<div ${r.join(" ")}>${bodyStr}</div>`;
        },
        selfClose: false
    }
};

function addChild(type = null, { name = "", parameter = {}, container = null, attrs = {} } = {}, parent, isbond = false) {
    if (!parent.isRemoved()) {
        if (!container) {
            container = parent.context.document.body;
        } else if (container instanceof MapDom) {
            container = container.getElement();
        }
        let _dom = parent.context.document.createElement("div");
        _dom.setAttribute("data-module", `out:${parent.getId()}`);
        Reflect.ownKeys(attrs).forEach(attr => _dom.setAttribute(attr, attrs[attr]));
        if (isbond && parent.getDDMContainer().contains(container)) {
            throw Error("[ada] BondViewGroup can not append child in the DDM container element");
        }
        container.appendChild(_dom);
        return parent.context.getViewInstance({
            viewClass: type,
            parent,
            name,
            dom: _dom,
            useProps: [],
            context: parent.context
        }).then(view => {
            if (!view.isRemoved()) {
                setProp(view, OUTERVIEW, true);
                return Promise.resolve().then(() => view.oncreated()).then(() => {
                    return view.update(parameter).then(() => {
                        parent.getChildren().push(view);
                    }).then(() => parent.onchildadded(view)).then(() => view.onready()).then(() => view);
                });
            }
        });
    } else {
        return Promise.reject(new ViewHadRemovedError('view had removed,can not add child'));
    }
}

class ViewEvent {
    constructor(target, type, data) {
        this.target = target;
        this.data = data;
        this.type = type;
        this._goon = true;
        this.currentTarget = null;
    }

    stopPropagation() {
        this._goon = false;
    }
}

class ClassNames {
    static getClassName(className, name) {
        if (className) {
            return `${className}-${name}`;
        } else {
            return name;
        }
    }

    constructor(view) {
        this._view = view;
        this._className = view.getAnnotationInfo().className || "";
    }

    add(name) {
        this._view.getElement().classList.add(ClassNames.getClassName(this._className, name));
        return this;
    }

    remove(name) {
        this._view.getElement().classList.remove(ClassNames.getClassName(this._className, name));
        return this;
    }

    has(name) {
        return this._view.getElement().classList.contains(ClassNames.getClassName(this._className, name));
    }

    toggle(name) {
        this._view.getElement().classList.toggle(ClassNames.getClassName(this._className, name));
        return this;
    }
}

class BaseView {
    constructor({ parent = null, dom = null, info = {}, name = "", useProps = [], context = null, id }) {
        if (!dom) {
            dom = context.document.body;
        }
        setProp(this, CONTEXT, context);
        setProp(this, IDNAME, id || randomid(10));
        setProp(this, PARENTVIEWTAG, parent);
        setProp(this, ELEMENTTAG, dom);
        setProp(this, ISREMOVED, false);
        setProp(this, PREREMOVED, false);
        setProp(this, VIEWINFO, info);
        setProp(this, VIEWNAME, name);
        setProp(this, USEPROPS, useProps);
        setProp(this, OBSERVERS, {});
        if (info.className) {
            setProp(this, CLASSNAME, info.className);
        }
        setProp(this, DDMTAG, new DDM({
            id: this.getId(),
            container: this.getDDMContainer(),
            templateStr: info.template || "",
            binders: ({ method, parameters }) => {
                let info = this[BINDERS] || {};
                let _method = info[method];
                if (_method && this[_method]) {
                    this[_method](parameters);
                }
            },
            option: {
                tags: this._getTags()
            },
            fns: this.fns(),
            macro: this._macros(),
            directives: this.directives(),
            className: info.className || "",
            context
        }));
        this.className = new ClassNames(this);
        this.getElement().setAttribute("data-module-id", this[IDNAME]);
    }

    get context() {
        return this[CONTEXT];
    }

    oncreated() {
    }

    onready() {
    }

    onupdated() {
    }

    oneffected() {
    }

    onunload() {
    }

    onrecover() {
    }

    getId() {
        return this[IDNAME];
    }

    getName() {
        return this[VIEWNAME];
    }

    getElement() {
        return this[ELEMENTTAG];
    }

    getParent() {
        return this[PARENTVIEWTAG];
    }

    getAnnotationInfo() {
        return this[VIEWINFO];
    }

    getDDMContainer() {
        return this[ELEMENTTAG];
    }

    isRemoved() {
        return this[ISREMOVED] === true;
    }

    isOuterView() {
        return this[OUTERVIEW] === true;
    }

    isRoot() {
        return this.getElement().dataset.module === 'ada-root' && this.getElement().dataset.appName === this.context.name;
    }

    finder(name) {
        return !this.isRemoved() ? this.getDDM().finder(name) : [];
    }

    finders(name) {
        return !this.isRemoved() ? this.getDDM().finders(name) : [];
    }

    group(name) {
        return !this.isRemoved() ? this.getDDM().group(name) : null;
    }

    groups(name) {
        return !this.isRemoved() ? this.getDDM().groups(name) : [];
    }

    getElementClassName(className = "") {
        if (!this.isRemoved()) {
            let name = this[CLASSNAME];
            if (name) {
                if (className) {
                    return `${name}-${className}`;
                } else {
                    return name;
                }
            } else {
                return className;
            }
        } else {
            return null;
        }
    }

    tags() {
        return {};
    }

    macros() {
        return {};
    }

    fns() {
        return {};
    }

    directives() {
        return {};
    }

    getDDM() {
        return this[DDMTAG];
    }

    getDataSet() {
        return null;
    }

    isRendered() {
        return this.getDDM().isRendered();
    }

    getClassName() {
        let path = "";
        if (this[VIEWINFO].module) {
            path = this[VIEWINFO].module;
        } else {
            path = this.constructor[MODULEPATH];
        }
        if (path) {
            let a = path.split(".");
            a.pop();
            return a.join(".").replace(/\//g, ".") + "." + this.constructor.name;
        } else {
            return this.constructor.name;
        }
    }

    getCurrentState() {
        return {};
    }

    getSnapshot() {
        return {};
    }

    dispatchEvent(type, data) {
        if (!this.isRemoved()) {
            let event = new ViewEvent(this, type, data), i = this;
            while (i) {
                i._triggerEvent(event);
                if (event._goon) {
                    i = i.getParent();
                } else {
                    break;
                }
            }
        }
    }

    rerender() {
    }

    getAssetURL(path) {
        let p = this.getAnnotationInfo().asset;
        if (p) {
            return (this.context.config.basePath + "/" + p + "/" + path).replace(/[\/]+/g, "/");
        } else {
            return "";
        }
    }

    excuteAssetScript(path) {
        let src = this.getAssetURL(path);
        return new Promise((resolve, reject) => {
            this.context.request.origin({ url: src, method: 'get' }).promise.then(({ data }) => {
                new Function("window", data).call(this.context.window, this.context.window);
                resolve();
            });
        });
    }

    excuteAssetStyle(path) {
        let src = this.getAssetURL(path);
        return new Promise((resolve, reject) => {
            if (!this.context.document.querySelector('script[src="' + src + '"]')) {
                let _a = this.context.document.createElement("style");
                _a.setAttribute("media", "screen");
                _a.setAttribute("type", "text/css");
                this.context.document.head.appendChild(_a);
            }
            resolve();
        });
    }

    on(type, fn) {
        if (!this[OBSERVERS][type]) {
            this[OBSERVERS][type] = [];
        }
        if (this[OBSERVERS][type].indexOf(fn) === -1) {
            this[OBSERVERS][type].push(fn);
        }
    }

    emit(type, data) {
        let targets = this[OBSERVERS][type] || [];
        return targets.reduce((a, observer) => {
            return a.then(() => {
                return new Promise(resolve => {
                    Promise.resolve().then(() => observer(data)).then(a => resolve(a), a => {
                        console.error(a);
                        resolve();
                    });
                });
            });
        }, Promise.resolve());
    }

    _triggerEvent(e) {
        if (!this.isRemoved()) {
            e.currentTarget = this;
            let handlerInfo = this[HANDLERS];
            if (handlerInfo && handlerInfo[e.type]) {
                this[handlerInfo[e.type]](e);
            }
        }
    }

    _getParentUseProps() {
        return this[USEPROPS];
    }

    _getChangedProps() {
        return [];
    }

    _getUsedProps() {
        return this.getDDM().getUseProps()
    }

    _getTags() {
        let _tags = this.tags(), result = {};
        Reflect.ownKeys(this.tags()).forEach(name => {
            let g = _tags[name];
            if (isFunction(g)) {
                result[name] = {
                    option: { type: g },
                    template({ bodyStr, props, events, attrs, generateOption }) {
                        let r = [`data-module=""`];
                        props.type = generateOption.type;
                        Reflect.ownKeys(attrs).forEach(attr => r.push(`${attr}="${attr}"`));
                        return `<div ${r.join(" ")}>${bodyStr}</div>`;
                    },
                    selfClose: false
                }
            } else {
                result[name] = g;
            }
        });
        return Object.assign(result, this.context.tags.get(), this._tags());
    }

    _refresh(force = false) {
        if (!this.isRemoved()) {
            return this.getDDM().modules().reduce((a, item) => {
                return a.then(() => {
                    let cache = item.element[VIEWTAG],
                        props = item.getAttributes(),
                        clazz = props["type"],
                        parameter = props["parameter"],
                        name = props["name"] || null,
                        id = props["id"],
                        useProps = props["useProps"] ? [...props["useProps"]] : [];
                    if (!cache || cache.constructor !== clazz || cache.isRemoved() || (props.hasOwnProperty('name') && cache.getName() !== name) || (props.hasOwnProperty('id') && cache.getId() !== id)) {
                        let ps = Promise.resolve();
                        if (cache && !cache.isRemoved()) {
                            ps = ps.then(() => cache._remove());
                        }
                        ps = ps.then(() => {
                            if (!this.isRemoved()) {
                                return this.context.getViewInstance({
                                    viewClass: clazz,
                                    parent: this,
                                    dom: item.element,
                                    name,
                                    useProps,
                                    context: this.context,
                                    id
                                }).then(_view => {
                                    if (!_view.isRemoved()) {
                                        _view.context.logger.group(`CREATE CHILD[${_view.getClassName() || ''}]`);
                                        return Promise.resolve().then(() => _view.oncreated()).then(() => {
                                            return _view.update(parameter).then(() => {
                                                if (this.onchildadded) {
                                                    return this.onchildadded(_view);
                                                }
                                            }).then(() => _view.onready()).then(() => {
                                                _view.context.logger.groupEnd();
                                                return _view;
                                            });
                                        });
                                    }
                                });
                            }
                        });
                        return ps;
                    } else {
                        if (cache && props.hasOwnProperty("parameter")) {
                            this.context.logger.group(`PREDIFF CHILD[${cache.getClassName() || ''}]`);
                            if (force || isPropsChange(this._getChangedProps(), cache._getParentUseProps())) {
                                this.context.logger.log(!force ? `RAMIN[USED] | ${cache.getClassName()}` : `FORCE | ${cache.getClassName()}`, "|", this._getChangedProps());
                                return cache.update(parameter).then(() => cache.oneffected()).then(() => {
                                    this.context.logger.groupEnd();
                                    return cache;
                                });
                            } else {
                                this.context.logger.log(!force ? `RAMOUT[USED] | ${cache.getClassName()}` : `FORCE | ${cache.getClassName()}`, "|", this._getChangedProps());
                                this.context.logger.groupEnd();
                            }
                        }
                        return Promise.resolve(undefined);
                    }
                });
            }, Promise.resolve()).then(() => {
                if (!this.isRemoved()) {
                    this[CHILDRENTAG] = this.getDDM().modules().map(item => {
                        let props = item.getAttributes();
                        let target = item.element[VIEWTAG];
                        target[USEPROPS] = props["useProps"] ? [...props["useProps"]] : [];
                        return target;
                    }).concat(this[CHILDRENTAG].filter(child => child.isOuterView()));
                    return this.onupdated();
                }
            });
        } else {
            return Promise.resolve();
        }
    }

    _macros() {
        return Object.assign(this.macros(), {});
    }

    _tags() {
        return {};
    }

    _remove() {
        if (!this.isRemoved()) {
            let ps = Promise.resolve();
            let parent = this.getParent();
            if (parent && !parent.isRemoved()) {
                let _target = parent[CHILDRENTAG].indexOf(this);
                if (_target !== -1) {
                    parent[CHILDRENTAG].splice(_target, 1);
                }
                if (this[PREREMOVED] !== true && parent.onchildremoved) {
                    ps = ps.then(() => parent.onchildremoved(this));
                }
            }
            ps = ps.then(() => {
                this.removeAllChild && this.removeAllChild();
                return this.onunload();
            }).then(() => {
                if (this.getElementClassName()) {
                    this.getElement().classList.remove(this.getElementClassName());
                }
                this.getElement().innerHTML = "";
                this[DATASET] && this[DATASET]._remove();
                Reflect.deleteProperty(this.getElement(), VIEWTAG);
                Reflect.ownKeys(this).forEach(key => {
                    this[key] = null;
                });
                this[ISREMOVED] = true;
            });
            return ps;
        }
        return Promise.resolve();
    }

    _clean() {
        this[ISREMOVED] = true;
        if (this.getParent()) {
            let children = this.getParent().getChildren();
            let index = children.indexOf(this);
            if (index !== -1) {
                children.splice(index, 1);
            }
        }
        this.onunload && this.onunload();
        Reflect.ownKeys(this).forEach(key => {
            if (key !== ISREMOVED) {
                this[key] = null;
            }
        });
    }
}

class ViewConnector extends BaseView {
    constructor(parameters) {
        super(parameters);
        setProp(this, CHILDRENTAG, []);
        setProp(this, CONNECTS, []);
        setProp(this, CHANGEPROPS, []);
        setProp(this, CONNECTSTATE, this.setContextDataSets((info, getter, setter) => {
            let _data = {};
            if (isFunction(info)) {
                info = {
                    service: info,
                    dataset: DataSet
                }
            }
            let dataset = getDataSetFromParent(this, info);
            if (dataset) {
                this[CONNECTS].push(dataset);
                _data = dataset._addListener(this, getter, setter);
            }
            return _data;
        }) || {});
    }

    setContextDataSets(connect) {
    }

    onupdate(current, data) {
        return current;
    }

    getCurrentState() {
        return this[CONNECTSTATE];
    }

    update(data) {
        if (!this.isRemoved()) {
            return this._updateFromParent(protectData(data));
        }
        return Promise.reject(new ViewHadRemovedError('view had removed,can not add child'));
    }

    onchildremoved() {
    }

    onchildadded() {
    }

    getChildAt(index = 0) {
        if (!this.isRemoved()) {
            return this[CHILDRENTAG][index];
        } else {
            return null;
        }
    }

    getChildrenByType(type) {
        if (!this.isRemoved() && type) {
            return this.getChildren().filter(child => child instanceof type);
        } else {
            return [];
        }
    }

    getChildByName(name) {
        if (!this.isRemoved() && name) {
            return this.getChildren().filter(child => child.getName() === name)[0] || null;
        } else {
            return null;
        }
    }

    getChildren() {
        if (!this.isRemoved()) {
            return this[CHILDRENTAG];
        } else {
            return [];
        }
    }

    getSnapshot() {
        return {
            state: this.getCurrentState(),
            id: this.getId(),
            name: this.getName(),
            connector: true,
            app: this.context.config.name
        }
    }

    rerender() {
        this.getElement().innerHTML = "";
        this.getDDM().render(this.getCurrentState(), false);
        return this._refresh();
    }

    _updateFromParent(parameter) {
        let collector = new Collector({ data: this.getCurrentState(), fn: this.onupdate });
        this[CONNECTSTATE] = collector.invoke(parameter, this);
        this[CHANGEPROPS] = collector.getChangedProps();
        if (isPropsChange(this._getChangedProps(), this._getUsedProps())) {
            this.context.logger.log(`RAMIN[USED] | ${this.getClassName()}`, "|", this._getChangedProps());
            return this._render();
        } else {
            this.context.logger.log(`RAMOUT[USED] | ${this.getClassName()}`, "|", this._getChangedProps());
            if (!this.isRendered()) {
                return this._render();
            }
        }
        return Promise.resolve();
    }

    _updateFromConnect({ data = {}, setter }) {
        let collector = new Collector({
            data: this.getCurrentState(),
            fn: setter
        });
        this[CONNECTSTATE] = collector.invoke(data, this);
        this[CHANGEPROPS] = collector.getChangedProps();
        if (isPropsChange(this._getChangedProps(), this._getUsedProps())) {
            this.context.logger.log(`RAMIN[USED] | ${this.getClassName()}`, "|", this._getChangedProps());
            return this._render();
        } else {
            this.context.logger.log(`RAMOUT[USED] | ${this.getClassName()}`, "|", this._getChangedProps());
        }
        return Promise.resolve();
    }

    _render(force) {
        let isRender = true;
        if (!force && this.isRendered()) {
            this.context.logger.log(`> ${!isPropsChangeEqual(this._getChangedProps(), this.getDDM().getPureUseProps()) ? 'RAMOUT' : 'RAMIN'}[PUREUSED] |`, this._getChangedProps());
            if (this.getDDM().getPureUseProps().length === 0 || !isPropsChangeEqual(this._getChangedProps(), this.getDDM().getPureUseProps())) {
                isRender = false;
                this.context.logger.log(`> RESETSTATE | ${this.getClassName()} | CONNECTOR`);
                this.getDDM().resetState(this.getCurrentState());
            }
        }
        if (isRender) {
            this.context.logger.log(`> RENDER | ${this.getClassName()} | CONNECTOR | ${force ? 'FORCE' : 'AUTO'} | ${this.getDDM().isRendered() ? 'DIFF' : 'INIT'}`);
            this.getDDM().render(this.getCurrentState());
        }
        return this._refresh(force);
    }

    _macros() {
        return Object.assign(this.macros(), macros);
    }

    _tags() {
        return tags;
    }

    _remove() {
        this[CONNECTS].forEach(dataset => dataset._removeListener(this));
        return super._remove();
    }

    _getChangedProps() {
        return this[CHANGEPROPS];
    }
}

class View extends BaseView {
    constructor(parameters) {
        super(parameters);
        setProp(this, BINDERS, Metadata.getMetadataExtends("binder", this.constructor.prototype));
        setProp(this, SUBSCRIBE, Metadata.getMetadataExtends("subscribe", this.constructor.prototype));
        setProp(this, HANDLERS, Metadata.getMetadataExtends("handler", this.constructor.prototype));
        if (this[VIEWINFO].dataset) {
            setProp(this, DATASET, DataSetHelper.getDataSet(this[VIEWINFO].dataset, this));
        }
    }

    onbeforecommit() {
    }

    oncommited() {
    }

    getDataSet() {
        return this[DATASET];
    }

    getCurrentState() {
        if (this[DATASET]) {
            return this[DATASET].getData();
        } else {
            return {};
        }
    }

    update(data) {
        if (!this.isRemoved()) {
            return this._updateFromParent(data);
        }
        return Promise.reject(new ViewHadRemovedError('view had removed,can not add child'));
    }

    commit(type, data) {
        if (this[DATASET]) {
            return this[DATASET].commit(type, data);
        } else {
            return null;
        }
    }

    getSnapshot() {
        return {
            state: this.getCurrentState(),
            id: this.getId(),
            name: this.getName(),
            useProps: this[USEPROPS],
            out: this.isOuterView(),
            module: this[VIEWINFO].module,
            connector: false,
            app: this.context.config.name
        }
    }

    rerender() {
        this.getElement().innerHTML = "";
        this.getDDM().render(this.getCurrentState(), false);
        if (this.context.config.develop && this.getDDM().modules().length > 0) {
            console.warn('[ada] view typeof View can not has any child [', this.getClassName(), ']');
        }
        return Promise.resolve().then(() => this.onupdated());
    }

    _updateFromParent(parameter) {
        if (this[DATASET] && parameter) {
            return this.commit("update", parameter);
        } else {
            if (!this.isRendered()) {
                return this._render();
            }
        }
        return Promise.resolve();
    }

    _updateFromDataSet() {
        if (this.isRendered()) {
            if (isPropsChangeEqual(this._getChangedProps(), this._getUsedProps())) {
                this.context.logger.log(`RAMIN[USED] | ${this.getClassName()}`, "|", this._getChangedProps());
                return this._render();
            } else {
                this.context.logger.log(`RAMOUT[USED] | ${this.getClassName()}`, "|", this._getChangedProps());
            }
        } else {
            return this._render();
        }
        return Promise.resolve();
    }

    _updateForceFromDataSet() {
        return this._render(true);
    }

    _render(force = false) {
        this.context.logger.log(`> RENDER | ${this.getClassName()} | ${force ? 'FORCE' : 'AUTO'} | ${this.getDDM().isRendered() ? 'DIFF' : 'INIT'}`);
        this.getDDM().render(this.getCurrentState());
        if (this.context.config.develop && this.getDDM().modules().length > 0) {
            console.warn('[ada] view typeof View can not has any child [', this.getClassName(), ']');
        }
        return Promise.resolve().then(() => this.onupdated());
    }

    _getChangedProps() {
        if (this[DATASET]) {
            return this[DATASET].getChangedProps();
        } else {
            return [];
        }
    }
}

class ViewGroup extends View {
    constructor(parameters = {}) {
        super(parameters);
        setProp(this, CHILDRENTAG, []);
    }

    onchildremoved() {
    }

    onchildadded() {
    }

    getChildAt(index = 0) {
        if (!this.isRemoved()) {
            return this[CHILDRENTAG][index];
        } else {
            return null;
        }
    }

    getChildrenByType(type) {
        if (!this.isRemoved() && type) {
            return this.getChildren().filter(child => child instanceof type);
        } else {
            return [];
        }
    }

    getChildByName(name) {
        if (!this.isRemoved() && name) {
            return this.getChildren().filter(child => child.getName() === name)[0] || null;
        } else {
            return null;
        }
    }

    getChildren() {
        if (!this.isRemoved()) {
            return this[CHILDRENTAG];
        } else {
            return [];
        }
    }

    getSnapshot() {
        return {
            state: this.getCurrentState(),
            id: this.getId(),
            name: this.getName(),
            useProps: this[USEPROPS],
            out: this.isOuterView(),
            module: this[VIEWINFO].module,
            connector: false,
            children: this.getChildren().map(child => {
                return child.getSnapshot();
            }),
            app: this.context.config.name
        };
    }

    tags() {
        return {};
    }

    rerender() {
        this.getElement().innerHTML = "";
        this.getDDM().render(this.getCurrentState(), false);
        return this._refresh(true);
    }

    _macros() {
        return Object.assign(this.macros(), macros);
    }

    _updateFromDataSet() {
        if (this.isRendered()) {
            if (isPropsChange(this._getChangedProps(), this._getUsedProps())) {
                this.context.logger.log(`RAMIN[USED] | ${this.getClassName()}`, "|", this._getChangedProps());
                return this._render();
            } else {
                this.context.logger.log(`RAMOUT[USED] | ${this.getClassName()}`, "|", this._getChangedProps());
            }
        } else {
            return this._render();
        }
        return Promise.resolve();
    }

    _render(force = false) {
        let isRender = true;
        if (!force && this.isRendered()) {
            this.context.logger.log(`> ${!isPropsChangeEqual(this._getChangedProps(), this.getDDM().getPureUseProps()) ? 'RAMOUT' : 'RAMIN'}[PUREUSED] |`, this._getChangedProps());
            if (this.getDDM().getPureUseProps().length === 0 || !isPropsChangeEqual(this._getChangedProps(), this.getDDM().getPureUseProps())) {
                isRender = false;
                this.context.logger.log(`> RESETSTATE | ${this.getClassName()}`);
                this.getDDM().resetState(this.getCurrentState());
            }
        }
        if (isRender) {
            this.context.logger.log(`> RENDER | ${this.getClassName()} | ${force ? 'FORCE' : 'AUTO'} | ${this.getDDM().isRendered() ? 'DIFF' : 'INIT'}`);
            this.getDDM().render(this.getCurrentState());
        }
        return this._refresh(force);
    }

    _tags() {
        return tags;
    }
}

class StaticViewGroup extends ViewGroup {
    constructor(parameters = {}) {
        super(parameters);
    }

    addChild(type = null, { name = "", parameter = {}, container = null, attrs = {} } = {}) {
        return addChild(type, arguments[1], this, false);
    }

    removeChild(view) {
        if (!this.isRemoved()) {
            let index = this.getChildren().indexOf(view);
            if (index !== -1) {
                this[CHILDRENTAG].splice(index, 1);
                if (!view.isRemoved()) {
                    view.getElement().parentNode.removeChild(view.getElement());
                }
            }
        }
        return this;
    }

    removeChildAt(index = 0) {
        if (!this.isRemoved()) {
            let view = this.getChildren()[index];
            if (view) {
                this.removeChild(view);
            }
        }
        return this;
    }

    removeChildByName(name) {
        if (!this.isRemoved() && name) {
            let child = this.getChildByName(name);
            if (child) {
                this.removeChild(child);
            }
        }
        return this;
    }

    removeAllChild() {
        if (!this.isRemoved()) {
            let children = this.getChildren();
            while (children && children.length > 0) {
                let view = children.shift();
                if (!view.isRemoved()) {
                    view.getElement().parentNode.removeChild(view.getElement());
                }
            }
        }
        return this;
    }

    removeChildByType(type) {
        if (!this.isRemoved() && type) {
            let children = this.getChildrenByType(type);
            while (children && children.length > 0) {
                let view = children.shift();
                if (!view.isRemoved()) {
                    view.getElement().parentNode.removeChild(view.getElement());
                }
            }
        }
        return this;
    }

    _macros() {
        return Object.assign(this.macros(), {});
    }

    _tags() {
        return {};
    }

    _refresh() {
        if (this.context.config.develop && this.getDDM().modules().length > 0) {
            console.warn('[ada] view typeof StaticViewGroup can not has any child defined in DDM [', this.getClassName(), ']');
        }
        return Promise.resolve().then(() => this.onupdated());
    }

    rerender() {
        console.warn("[ada] StaticViewGroup UnSupport rerender()");
    }
}

class BondViewGroup extends ViewGroup {
    getDDMContainer() {
        if (!this[DDMCONTAINER]) {
            let ddmcontainer = this.getElement().querySelector("." + this.getElementClassName("ddmcontainer"));
            if (!ddmcontainer) {
                ddmcontainer = this.context.document.createElement("div");
                ddmcontainer.setAttribute("class", this.getElementClassName("ddmcontainer"));
                this.getElement().appendChild(ddmcontainer);
            }
            setProp(this, DDMCONTAINER, ddmcontainer);
        }
        return this[DDMCONTAINER];
    }

    addChild(type = null, { name = "", parameter = {}, container = null, attrs = {} } = {}) {
        return addChild(type, arguments[1], this, true);
    }

    addChildApp({ name, container }) {
        if (!this.isRemoved()) {
            let context = this.context.manager.getContext(name);
            return context.boot({ container, parent: this }).then(view => {
                if (!view.isRemoved()) {
                    setProp(view, OUTERVIEW, true);
                    this.getChildren().push(view);
                    return Promise.resolve().then(() => this.onchildadded(view)).then(() => view);
                }
            });
        } else {
            return Promise.reject(new ViewHadRemovedError('view had removed,can not add child'));
        }
    }

    removeChild(view) {
        if (!this.isRemoved()) {
            let index = this.getChildren().indexOf(view);
            if (index !== -1) {
                this[CHILDRENTAG].splice(index, 1);
                if (!view.isRemoved()) {
                    if (!this.getDDMContainer().contains(view.getElement())) {
                        view.getElement().parentNode.removeChild(view.getElement());
                    } else {
                        throw Error("[ada] BondViewGroup can not remove child in the DDM container");
                    }
                }
            }
        }
        return this;
    }

    removeAllChild() {
        let children = this.getChildren().filter(child => {
            if (!child.isRemoved()) {
                if (!this.getDDMContainer().contains(child.getElement())) {
                    return child;
                }
            }
        });
        while (children && children.length > 0) {
            let view = children.shift();
            if (!view.isRemoved()) {
                view.getElement().parentNode.removeChild(view.getElement());
            }
        }
    }

    removeChildByType(type) {
        if (!this.isRemoved() && type) {
            let children = this.getChildrenByType(type);
            while (children.length > 0) {
                let view = children.shift();
                if (!view.isRemoved()) {
                    view.getElement().parentNode.removeChild(view.getElement());
                }
            }
        }
        return this;
    }

    removeChildByName(name) {
        if (!this.isRemoved() && name) {
            let child = this.getChildByName(name);
            if (child) {
                this.removeChild(child);
            }
        }
        return this;
    }

    rerender() {
        this.getDDMContainer().innerHTML = "";
        this.getDDM().render(this.getCurrentState(), false);
        return this._refresh(true);
    }
}

module.exports = { View, ViewGroup, StaticViewGroup, BondViewGroup, ViewConnector };