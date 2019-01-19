let {BondViewGroup, StaticViewGroup, View, ViewConnector, ViewGroup} = require("./src/view");
let {DataSet, DataSetHelper, Service, TransactDataSet} = require("./src/dataset");
let factory = require("./src/util/factory");
let client = require("./src/hmr/client");
let {PROXYSTATE, VIEWTAG, ROOTELEMENTNAME} = require("./src/util/const");
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
	isBrowser,
	randomid
} = require("./src/util/helper");
let BrowserContext = require("./src/context/browser");
let env = require("./src/env");

if (isBrowser()) {
	let context = new BrowserContext();
	env.develop = true;
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
			factory.recover(context, info);
		},
		startLogger() {
			context.logger.on = true;
			return "Logger Started";
		},
		stopLogger() {
			context.logger.on = false;
			return "Logger Stopped";
		}
	};
	client.client.start(context);
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