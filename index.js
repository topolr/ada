let {BondViewGroup, StaticViewGroup, View, ViewConnector, ViewGroup} = require("./src/view");
let {DataSet, Service, TransactDataSet} = require("./src/dataset");
let factory = require("./src/util/factory");
let {Dispatcher} = require("./src/dispatcher");
let Passable = require("./src/passable");
let {view, root, action, handler, subscribe, compute, binder} = require("./src/annotation");
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

if (isBrowser()) {
    let context = new BrowserContext();
    context.window.Ada = {
        modules: context.loader.moduleLoader,
        init(initer) {
            factory.init(context, initer);
        },
        boot: function (ops) {
            ops.context = context;
            factory.boot(ops);
        },
        unpack(info) {
            context.loader.decompress(info);
        },
        installModule(name, module) {
            context.loader.moduleLoader.set(name, module);
        },
        recover(info) {
            factory.recover(context, info);
        }
    };
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