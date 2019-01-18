let fs = require("fs");

class Loader {
	constructor(context) {
		this._context = context;
	}

	get context() {
		return this._context;
	}

	loadModule(path) {
	}

	loadSource(path) {
		return Promise.resolve(fs.readFileSync(path, "utf-8"));
	}
}

module.exports = Loader;