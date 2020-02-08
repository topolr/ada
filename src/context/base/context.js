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
		this._manager = null;
		this._manifest = null;
		this._manifestPs = null;
		this._hooks = {
			sourceexcute: []
		};
	}

	_invokeHook(type, params) {
		return (this._hooks[type] || []).reduce((a, hooker) => {
			return a.then(() => {
				return Promise.resolve().then(() => hooker(params));
			});
		}, Promise.resolve());
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

	getRootView({ rootClass, container, parameter = {}, parent = null }) {
		let rootElement = this.document.createElement("div");
		rootElement.setAttribute("id", `ada-root-${this.config.name}`);
		rootElement.setAttribute("data-module", `ada-root`);
		rootElement.setAttribute("data-app-name", this.config.name);
		container.appendChild(rootElement);
		let root = rootElement[VIEWTAG];
		if (!root) {
			return this.getViewInstance({
				viewClass: rootClass,
				parent,
				dom: rootElement,
				tag: "root",
				name: `ada-root-${this.name}`,
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

	ready() {
		if (!this._manifest) {
			if (!this._manifestPs) {
				let url = this.config.siteURL;
				if (url[url.length - 1] !== '/') {
					url = url + '/';
				}
				this._manifestPs = this.request.origin({
					url: `${url}manifest.json`,
					method: 'get'
				}).promise.then(info => JSON.parse(info.data)).then(info => {
					this._manifest = info;
					this._manifestPs = null;
					return this._manifest;
				}).then((info) => {
					let basePath = info.siteURL;
					let { root, develop, map, initer, worker } = info;
					Object.assign(this._config, { root, basePath, develop, sourceMap: map });
					env.develop = info.develop;
					if (initer) {
						let q = new Function(`return ${initer}`)();
						q(this);
					}
					if (worker) {
						let { url, scope } = worker;
						if (navigator.serviceWorker) {
							let t = navigator.serviceWorker.register(url, { scope });
							this._invokeHook('serviceworker', t);
						}
					}
				});
			}
			return this._manifestPs;
		} else {
			return Promise.resolve();
		}
	}

	boot({ parameter = {}, container, parent = null } = {}) {
		return this.ready().then(() => {
			Object.assign(this._config, { parameter });
			let root = this._config.root;
			if (root.indexOf("./") === 0) {
				root = root.substring(2);
			}
			if (root.indexOf("/") === 0) {
				root = root.substring(1);
			}
			return this.loader.loadModule(root).then(() => {
				let rootClass = null;
				this.loader.moduleLoader.scanClass((path, module) => {
					if (Metadata.getMetadata("root", module.prototype)) {
						rootClass = module;
						return false;
					}
				});
				if (rootClass) {
					return this.getRootView({ rootClass, container, parameter, parent });
				} else {
					console.error("root class can not find");
					return Promise.reject();
				}
			});
		});
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

	get manager() {
		return this._manager;
	}

	snapshot() {
		this._manager && this._manager.snapshot();
	}
}

module.exports = BaseContext;