let BaseContext = require("../base/context");
let Window = require("./window");
let ServerLogger = require("./logger");
let RequestManager = require("./../local/request");
let ServerRequest = require("./req");
let Loader = require("./loader");

class ServerContext extends BaseContext {
	constructor({ origin = "http://localhost", html = "" } = {}) {
		super(arguments[0]);
		this._window = new Window(this, origin, html);
		this._logger = new ServerLogger(this);
		this._request = new RequestManager(this, ServerRequest);
		this._loader = new Loader(this);
	}

	get window() {
		return this._window;
	}

	set window(win) {
		this._window = win;
	}

	get document() {
		return this._window.document;
	}

	get isBrowser() {
		return false;
	}

	get logger() {
		return this._logger;
	}

	get request() {
		return this._request;
	}
}

module.exports = ServerContext;