require("colors");
let ServerContext = require("../src/context/server/index");
let env = require("../src/env");
let { root, BondViewGroup, View } = require("../index");
let { SyncFile } = require("ada-util");
let Path = require("path");
let Loader = require("../src/context/browser/loader");
let { VIEWTAG } = require("../src/util/const");
let stream = require('stream');
let Manager = require("./../src/manager");

class DefaultRootView extends BondViewGroup {
}

root({ className: "" })(DefaultRootView);

class Renderer {
	constructor({ origin = "http://localhost", html = "" } = {}) {
		this._context = new ServerContext({ origin, html, siteURL: origin, name: 'root' });
	}

	get env() {
		return env;
	}

	get context() {
		return this._context;
	}

	getCurrentHTML() {
		return this._context.document.innerHTML;
	}

	getRootView(view, parameters = {}) {
		if (!view || !view.prototype instanceof View) {
			parameters = view;
			view = DefaultRootView;
		}
		let context = this._context;
		return context.getRootView({ rootClass: view, parameters, container: context.document.body }).then(root => {
			context.document.addEventListener("DOMNodeRemoved", (e) => context._cleanView(e.target));
			return root;
		});
	}
}

class DistRenderer {
	constructor({ origin = "http://localhost", distPath = "" } = {}) {
		this._init = false;
		this._outputTask = [];
		this._currentTask = null;
		this._lastSnapshot = null;
		const manager = new Manager(ServerContext, {
			origin,
			html: new SyncFile(Path.resolve(distPath, "index.html")).read()
		});
		manager.context._loader = new Loader(manager.context);
		manager.setContext(context => {
			context._window = manager.context._window;
			context._loader = new Loader(context);
		});
		let ada = {};
		manager.context.window.Ada = ada;
		ada.unpack = (appName, info) => {
			manager.unpack(appName, info);
		};
		ada.installModule = (name, module) => {
			manager.installModule(name, module);
		};
		ada.recover = () => {
		};
		ada.boot = (ops) => {
			manager.boot(ops);
		};
		manager.installModule("adajs", require("../index"));
		manager._snapshootalways = () => {
			let info = this._currentTask;
			if (info && info.url === manager.context.window.location.href) {
				clearTimeout(info.timmer);
				let snapshortstr = "<!DOCTYPE html>" + this.getCurrentHTML();
				this._lastSnapshot = {
					url: manager.context.window.location.href,
					code: snapshortstr
				};
				info.fn(snapshortstr);
			}
			this._currentTask = null;
			this._next();
		};
		this._context = manager.context;
		this._manager = manager;
		this.script = "";
		this._context.document.querySelectorAll("script").some(el => {
			let code = el.innerHTML;
			if (/Ada.boot\([\s\S]+?\)/.test(code)) {
				this.script = code;
				return true;
			}
		});
	}

	get env() {
		return env;
	}

	get context() {
		return this._context;
	}

	getCurrentHTML() {
		this._context.document.head.querySelectorAll("script").forEach(el => {
			this._context.document.body.appendChild(el);
		});
		if (!this._context.document.getElementById("ada-module-snapshot")) {
			try {
				let script = this._context.document.createElement("script");
				script.setAttribute("id", "ada-module-snapshot");
				script.innerHTML = "Ada.recover(" + JSON.stringify(this._getViewSnapshots()) + ")";
				this._context.document.body.appendChild(script);
			} catch (e) {
				console.log(e);
			}
		}
		return this._context.document.innerHTML;
	}

	outputURL(url) {
		if (url) {
			url = this._regularURL(url);
			return new Promise((resolve) => {
				this._outputTask.push({
					url,
					fn: resolve,
					timmer: setTimeout(() => {
						throw Error("[ada] program runs slowly or no snapshot calls");
					}, 1500)
				});
				this._next();
			});
		} else {
			return Promise.resolve('');
		}
	}

	outputURLs(urls) {
		let result = {};
		return urls.reduce((a, url) => {
			return a.then(() => {
				return this.outputURL(url).then(code => {
					result[url] = code;
				});
			});
		}, Promise.resolve()).then(() => result);
	}

	_next() {
		if (!this._currentTask && this._outputTask.length > 0) {
			this._currentTask = this._outputTask.shift();
			if (this.context.window.location.href === this._currentTask.url) {
				if (this._lastSnapshot && this._lastSnapshot.url === this._currentTask.url) {
					this._currentTask.fn(this._lastSnapshot.code);
					this._currentTask = null;
					this._next();
				}
			} else {
				this.context.window.location.href = this._currentTask.url;
				if (!this._init) {
					new Function("Ada", this.script)(this._context.window.Ada);
				}
			}
		}
	}

	_getRootView() {
		let rootElement = this.context.document.getElementById(`ada-root-${this._manager._root}`);
		return rootElement[VIEWTAG];
	}

	_getViewSnapshots() {
		return this._getRootView().getSnapshot();
	}

	_regularURL(pageUrl) {
		let url = pageUrl.trim();
		if (url.indexOf("http") !== 0) {
			if (url[0] === '/') {
				url = this.context.window.location.origin + url;
			} else {
				let t = this.context.window.location.split("/");
				let tl = t[t.length - 1];
				if (tl.indexOf(".") === -1) {
					url = this.context.window.location.origin + this.context.window.location.pathname + "/" + url;
				} else {
					t.pop();
					url = this.context.window.location.origin + t.join("/") + "/" + url;
				}
			}
			url = url.replace(/\s/g, () => '').replace(/[0-9a-zA-Z]\/+/g, str => str[0] + "/");
		}
		return url;
	}
}

class DistSteamRenderer extends DistRenderer {
	constructor(ops) {
		super(ops);
		this._context._snapshootalways = () => {
			let info = this._currentTask;
			if (info && info.url === this._context.window.location.href) {
				clearTimeout(info.timmer);
				this._lastSnapshot = {
					url: this._context.window.location.href,
					body: this._context.document.body.innerHTML,
					head: this._getHeaderStr(),
					script: this._getScript()
				};
				info.stream.push(this._lastSnapshot.head);
				info.stream.push("</head><body>");
				info.stream.push(this._lastSnapshot.body);
				info.stream.push(this._lastSnapshot.script);
				info.stream.push("</body>");
				info.stream.push("</html>");
				info.stream.push(null);
			}
			this._currentTask = null;
			this._next();
		};
		let script = this._context.document.createElement("div");
		this._context.document.head.querySelectorAll("script").forEach(el => {
			script.appendChild(el);
		});
		this._script = script.innerHTML;
	}

	outputStream(url) {
		if (url) {
			url = this._regularURL(url);
			let st = new stream.Readable();
			st._read = () => {
			};
			this._outputTask.push({
				url, stream: st, timmer: setTimeout(() => {
					throw Error("[ada] program runs slowly or no snapshot calls");
				}, 1000)
			});
			st.push("<!DOCTYPE html><html><head>");
			st.push(this._context.document.querySelector("head").innerHTML);
			this._next();
			return st;
		} else {
			throw Error("[ada] url can not empty");
		}
	}

	_getHeaderStr() {
		let str = '';
		this._context.document.head.childNodes.filter(el => el._output !== true).forEach(el => {
			str += el.outerHTML;
		});
		return str;
	}

	_getScript() {
		let script = this._context.document.createElement("script");
		script.setAttribute("id", "ada-module-snapshot");
		script.innerHTML = "Ada.recover(" + JSON.stringify(this._getViewSnapshots()) + ")";
		return this._script + script.outerHTML;
	}

	_next() {
		if (!this._currentTask && this._outputTask.length > 0) {
			this._currentTask = this._outputTask.shift();
			if (this.context.window.location.href === this._currentTask.url) {
				if (this._lastSnapshot && this._lastSnapshot.url === this._currentTask.url) {
					let info = this._currentTask;
					info.stream.push(this._lastSnapshot.head);
					info.stream.push("</head><body>");
					info.stream.push(this._lastSnapshot.body);
					info.stream.push(this._lastSnapshot.script);
					info.stream.push("</body>");
					info.stream.push("</html>");
					info.stream.push(null);
					this._currentTask = null;
					this._next();
				}
			} else {
				this.context.window.location.href = this._currentTask.url;
				this.context.document.head.childNodes.forEach(el => el._output = true);
				if (!this._init) {
					new Function("Ada", this.script)(this._context.window.Ada);
				}
			}
		}
	}
}

module.exports = { Renderer, DistRenderer, DistSteamRenderer };