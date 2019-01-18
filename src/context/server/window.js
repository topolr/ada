let Document = require("./document");
let Location = require("./location");
let LocalStorage = require("./storage");
let History = require("./history");
let Event = require("./event");

let TYPES = ["popstate", "hashchange"];

class Window extends Event {
	constructor(context, url, html) {
		super();
		this._context = context;
		this._onpopstate = null;
		this._onhashchange = null;
		this._document = new Document(html);
		this._location = new Location(context, url);
		this._history = new History(context, url);
		this._localStorage = new LocalStorage();
	}

	get document() {
		return this._document;
	}

	get location() {
		return this._location;
	}

	get localStorage() {
		return this._localStorage;
	}

	get history() {
		return this._history;
	}

	get setTimeout() {
		return setTimeout;
	}

	get onpopstate() {
		return this._onpopstate;
	}

	get onhashchange() {
		return this._onhashchange;
	}

	set onpopstate(fn) {
		this._onpopstate = fn;
	}

	set onhashchange(fn) {
		this._onhashchange = fn;
	}

	addEventListener(type, fn) {
		if (TYPES.indexOf(type) !== -1) {
			this[`on${type}`] = fn;
		}
		super.addEventListener(type, fn);
	}

	_triggerEvent(event) {
		let type = event.type;
		super._triggerEvent(event);
		if (TYPES.indexOf(type) !== -1) {
			this[`on${type}`](event);
		}
	}

	_reload() {
		let cookie = this._document.cookie;
		this._document = new Document(this._document._html);
		this._document._cookie = cookie;
	}
}

module.exports = Window;