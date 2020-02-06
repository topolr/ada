let Tag = require("../local/tag");
let DDMVariables = require("../local/ddm");
let Metadata = require("./../../lib/metadata");
let { VIEWTAG } = require("./../../util/const");
let { parseTemplate, parseStyle, excuteStyle, setProp } = require("./../../util/helper");
let env = require("./../../env");

class BaseContext {
	constructor(config = {}) {
		this._tags = new Tag();
		this._ddm = new DDMVariables();
		this._config = Object.assign({
			siteURL: '',
			name: ''
		}, config);
		this._loader = null;
		this._onsnapshoot = null;
		this._snapshootalways = null;
		this._hooks = {
			initdone: [],
			bootdone: [],
			recoverdone: [],
			sourceexcute: [],
			sourceready: [],
			sourcepersistence: []
		};
		this._bootFlow = Promise.resolve();
		this._steps = [];
	}

	_invokeHook(type, params) {
		let t = this._hooks[type];
		if (t) {
			return t.reduce((a, hook) => {
				return a.then(info => {
					return new Promise(resolve => {
						hook(params, result => resolve(result), info);
					});
				});
			}, Promise.resolve(params));
		}
	}

	_invokeSyncHook(type, params) {
		let t = this._hooks[type];
		if (t) {
			return t.reduce((a, hook) => {
				return hook(params, a);
			}, params);
		}
	}

	getViewInstance({ viewClass, parent, dom, name = "", tag = "view", useProps = [], id }) {
		let info = Metadata.getMetadataExtends(tag, viewClass.prototype);
		let ps = Promise.resolve();
		info.className = info.className ? `${this.config.name}-${info.className}` : info.className;
		if (info.template) {
			let code = info.template;
			if (code.path) {
				ps = ps.then(() => this.loader.loadSource(info.template.path));
			} else {
				ps = ps.then(() => code);
			}
			ps = ps.then(code => {
				info.template = parseTemplate(code, info.className);
			});
		}
		if (info.style) {
			let code = info.style;
			if (code.path) {
				ps = ps.then(() => this.loader.loadSource(info.style.path));
			} else {
				ps = ps.then(() => code);
			}
			ps = ps.then(code => {
				excuteStyle(parseStyle(code, info.className), `${this.config.name}-${info.module.replace(/\//g, "-")}:${info.className}`, this);
			});
		}
		return ps.then(() => {
			if (info.className) {
				dom.classList.add(info.className);
			}
			let _view = new viewClass({
				parent,
				info,
				name,
				dom,
				useProps,
				context: this,
				id
			});
			setProp(dom, VIEWTAG, _view);
			return _view;
		});
	}

	getRootView({ rootClass, container, parameter = {} }) {
		let rootElement = this.document.createElement("div");
		// rootElement.setAttribute("id", ROOTELEMENTNAME);
		// rootElement.setAttribute("class", ROOTELEMENTNAME);
		rootElement.setAttribute("data-module", `ada-root`);
		rootElement.setAttribute("data-app-name", this.config.name);
		container.appendChild(rootElement);
		let root = rootElement[VIEWTAG];
		if (!root) {
			return this.getViewInstance({
				viewClass: rootClass,
				parent: null,
				dom: rootElement,
				tag: "root",
				name: "root",
				useProps: [],
				context: this
			}).then(view => {
				return Promise.resolve().then(() => view.oncreated()).then(() => {
					return view.update(parameter).then(() => view.onready());
				}).then(() => {
					return view;
				});
			});
		}
		return Promise.resolve(root);
	}

	getManifest() {
		return this.request.get(this.config.siteURL + 'manifest.json');
	}

	init(initer) {
		this._steps.push("init");
		if (initer) {
			this._bootFlow = this._bootFlow.then(() => initer.call({ context: this })).then(info => {
				return this._invokeHook("initdone", info);
			});
		}
	}

	boot({ parameter = {}, container } = {}) {
		return this.getManifest().then(info => {
			let basePath = info.siteURL;
			let { root, develop, map } = info;
			this._steps.push("boot");
			Object.assign(this._config, { root, basePath, develop, parameter, sourceMap: map });
			env.develop = info.develop;
			if (root.indexOf("./") === 0) {
				root = root.substring(2);
			}
			if (root.indexOf("/") === 0) {
				root = root.substring(1);
			}
			this._bootFlow = this._bootFlow.then(() => {
				return this.loader.loadModule(root).then(() => {
					let rootClass = null;
					this.loader.moduleLoader.scanClass((path, module) => {
						if (Metadata.getMetadata("root", module.prototype)) {
							rootClass = module;
							return false;
						}
					});
					if (rootClass) {
						return this.getRootView({ rootClass, container, parameter });
					} else {
						console.error("root class can not find");
						return Promise.reject();
					}
				});
			}).then((view) => {
				return this._invokeHook("bootdone").then(() => view);
			});
			return this._bootFlow;
		});
	}

	hook(type, fn) {
		let t = this._hooks[type];
		if (t && t.indexOf(fn) === -1) {
			t.push(fn);
		}
	}

	unhook(type, fn) {
		let t = this._hooks[type], i = t.indexOf(fn);
		if (i !== -1) {
			t.splice(i, 1);
		}
	}

	get loader() {
		return this._loader;
	}

	get name() {
		return this._config.name;
	}

	get config() {
		return this._config;
	}

	set config(conf) {
		Object.assign(this._config, conf);
	}

	get tags() {
		return this._tags;
	}

	get ddm() {
		return this._ddm;
	}

	get window() {
	}

	get document() {
	}

	set onsnapshoot(fn) {
		this._onsnapshoot = fn;
	}

	get isBrowser() {
		return true;
	}

	get request() {
		return null;
	}

	snapshot() {
		this._snapshootalways && this._snapshootalways();
		this._onsnapshoot && this._onsnapshoot();
	}
}

module.exports = BaseContext;