let { BondViewGroup, StaticViewGroup, View, ViewConnector, ViewGroup } = require("./src/view");
let { DataSet, Service, TransactDataSet } = require("./src/dataset");
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
    randomid,
    isBrowser
} = require("./src/util/helper");
let BrowserContext = require("./src/context/browser");
let env = require("./src/env");
let Manager = require("./src/manager");

if (isBrowser()) {
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
        recover(info) {
            manager.recover(info);
        }
    };
    Dispatcher.request = manager.context.request;
}

module.exports = {
    View,
    ViewGroup,
    StaticViewGroup,
    BondViewGroup,
    ViewConnector,
    Service,
    DataSet,
    TransactDataSet,
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