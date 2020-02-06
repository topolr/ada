let BaseContext = require("../base/context");
let {isBrowser} = require("../../util/helper");
let Loader = require("./loader");
let BrowserLogger = require("./logger");
let BrowserRequest = require("./req");
let RequestManager = require("./../local/request");

class BrowserContext extends BaseContext {
	constructor(a) {
		super(a);
		this._window = {};
		if (isBrowser()) {
			this._window = window;
		}
		this._loader = new Loader(this);
		this._logger = new BrowserLogger(this);
		this._request = new RequestManager(this, BrowserRequest);
	}

	get window() {
		return this._window;
	}

	get document() {
		return this._window.document;
	}

	get logger() {
		return this._logger;
	}

	get request() {
		return this._request;
	}
}


module.exports = BrowserContext;