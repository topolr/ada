let { BondViewGroup, StaticViewGroup, View, ViewConnector, ViewGroup } = require("./src/view");
let { DataSet, DataSetHelper, Service, TransactDataSet } = require("./src/dataset");
let client = require("./src/hmr/client");
let { PROXYSTATE, VIEWTAG, ROOTELEMENTNAME } = require("./src/util/const");
let { Dispatcher } = require("./src/dispatcher");
let Passable = require("./src/passable");
let { view, root, action, handler, subscribe, compute, binder } = require("./src/annotation");
let {
    clone,
    encodeHTML,
    excuteStyle,
    extend,
    hashCode,
    isArray,
    isEqual,
    isFunction,
    isObject,
    isPlainObject,
    isQueryString,
    isString,
    isBrowser,
    randomid
} = require("./src/util/helper");
let BrowserContext = require("./src/context/browser");
let env = require("./src/env");
let Manager = require("./src/manager");

if (isBrowser()) {
    env.develop = true;
    const manager = new Manager(BrowserContext);
    manager._context.window.Ada = {
        boot(ops) {
            manager.boot(ops);
        },
        unpack(appName, info) {
            manager.unpack(appName, info);
        },
        installModule(name, module) {
            manager.installModule(name, module);
        },
        view(dom) {
            let target = null;
            if (!dom) {
                target = context.document.getElementById(ROOTELEMENTNAME)[VIEWTAG];
            } else {
                target = dom[VIEWTAG];
            }
            return target;
        },
        viewTypeString(view) {
            if (view instanceof BondViewGroup) {
                return "BondViewGroup";
            } else if (view instanceof StaticViewGroup) {
                return "StaticViewGroup";
            } else if (view instanceof ViewGroup) {
                return "ViewGroup";
            } else if (view instanceof View) {
                return "View";
            } else if (view instanceof ViewConnector) {
                return "ViewConnector";
            } else {
                return "UNKNOW";
            }
        },
        viewTree(dom) {
            let next = (view) => {
                console.group(`${this.viewTypeString(view)} [${view.getClassName()}]`);
                console.log(view);
                if (view.getChildren && view.getChildren().length > 0) {
                    console.group(`CHILDREN`);
                    view.getChildren().forEach(child => {
                        next(child);
                    });
                    console.groupEnd();
                }
                console.groupEnd();
            };
            next(this.view(dom));
            return "";
        },
        findView(id) {
            let result = null;
            let next = (view) => {
                if (view.getId() === id) {
                    result = view;
                    return true;
                } else {
                    if (view.getChildren && view.getChildren().length > 0) {
                        return view.getChildren().some(child => {
                            return next(child);
                        });
                    } else {
                        return false;
                    }
                }
            };
            next(this.view());
            return result;
        },
        log(...paras) {
            console.log(...paras.map(value => {
                if (!!value && !!value[PROXYSTATE]) {
                    return value[PROXYSTATE]._data;
                } else {
                    return value;
                }
            }));
            return "";
        },
        client,
        recover(info) {
            manager.recover(info);
        },
        startLogger() {
            manager.startLogger();
            return "Logger Started";
        },
        stopLogger() {
            manager.stopLogger();
            return "Logger Stopped";
        }
    };
    client.client.start(manager);
    Dispatcher.request = manager.context.request;
}

module.exports = {
    View,
    ViewGroup,
    StaticViewGroup,
    BondViewGroup,
    Service,
    ViewConnector,
    DataSet,
    TransactDataSet,
    DataSetHelper,
    Dispatcher,
    Passable,
    util: {
        randomid,
        hashCode,
        isString,
        isFunction,
        isEqual,
        isObject,
        isPlainObject,
        isArray,
        isQueryString,
        excuteStyle,
        encodeHTML,
        extend,
        clone
    },
    view,
    root,
    action,
    handler,
    subscribe,
    compute,
    binder,
    env
};