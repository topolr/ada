let Tag = require("../local/tag");
let DDMVariables = require("../local/ddm");

class BaseContext {
	constructor() {
		this._tags = new Tag();
		this._ddm = new DDMVariables();
		this._config = {
			root: "",
			basePath: "",
			parameter: {},
			sourceMap: {}
		};
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

	snapshot() {
		this._snapshootalways && this._snapshootalways();
		this._onsnapshoot && this._onsnapshoot();
	}
}

module.exports = BaseContext;