let BaseContext = require("../base/context");
let Window = require("./window");
let ServerLogger = require("./logger");
let RequestManager = require("./../local/request");
let ServerRequest = require("./req");

class ServerContext extends BaseContext {
	constructor({origin = "http://localhost", html = ""} = {}) {
		super();
		this._window = new Window(this, origin, html);
		this._logger = new ServerLogger(this);
		this._request = new RequestManager(this, ServerRequest);
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