let {isEqual} = require("../../util/helper");

const util = {
	isSameQuery(a, b) {
		let aInfo = {}, bInfo = {};
		a.substring(1).split("&").forEach(item => {
			let e = item.split("=");
			aInfo[e[0]] = e[1];
		});
		b.substring(1).split("&").forEach(item => {
			let e = item.split("=");
			bInfo[e[0]] = e[1];
		});
		return isEqual(aInfo, bInfo);
	}
};

class Location {
	constructor(context, url = "http://localhost") {
		this._context = context;
		this._info = Location.parseURL(url);
	}

	static parseURL(url) {
		let a = url.trim();
		a = a.replace(/\s/g, () => '').replace(/[0-9a-zA-Z]\/+/g, str => str[0] + "/");
		let searchn = a.split("?");
		let search = "";
		let hash = "";
		let ct = "";
		if (searchn[1]) {
			let m = searchn[1].split("#");
			search = m[0];
			hash = m[1] || "";
			ct = searchn[0];
		} else {
			let hashn = a.split("#");
			if (hashn[1]) {
				hash = hashn[1];
			}
			ct = hashn[0];
		}
		let protocol = a.split(":")[0];
		let b = ct.substring(protocol.length + 3).split("/");
		let hostn = b.shift().split(":");
		let host = hostn[0];
		let port = hostn[1] || "";
		return {
			hash: hash ? "#" + hash : "",
			host: host,
			hostname: host,
			href: a,
			origin: protocol + "://" + host + (port === "80" || !port ? '' : `:${port}`),
			pathname: "/" + b.join("/"),
			port: port,
			protocol: protocol,
			search: search ? "?" + search : "",
			url: a
		};
	}

	get href() {
		return this._info.url;
	}

	set href(url) {
		this._setHref(url);
	}

	get protocol() {
		return this._info.protocol;
	}

	get host() {
		return this._info.host;
	}

	get hostname() {
		return this._info.hostname;
	}

	get port() {
		return this._info.port;
	}

	get pathname() {
		return this._info.pathname;
	}

	get search() {
		return this._info.search;
	}

	get hash() {
		return this._info.hash;
	}

	get origin() {
		return this._info.origin;
	}

	reload() {
		this._context.window._reload();
	}

	toString() {
		return this.href;
	}

	_setHref(url, canReload = true, canPushHistory = true) {
		if (url) {
			url = url.trim();
			let _info = this._info;
			if (url.indexOf("http") === 0) {
				_info = Location.parseURL(url);
			} else {
				if (url[0] === "/") {
					_info = Location.parseURL(this.origin + url);
				} else {
					let t = this.pathname.split("/");
					let tl = t[t.length - 1];
					if (tl.indexOf(".") === -1) {
						_info = Location.parseURL(this.origin + "/" + this.pathname + "/" + url);
					} else {
						t.pop();
						_info = Location.parseURL(this.origin + "/" + t.join("/") + "/" + url);
					}
				}
			}
			let isReload = true;
			if (_info.origin === this._info.origin && _info.pathname === this._info.pathname) {
				if (_info.search && this._info.search) {
					isReload = util.isSameQuery(_info.search, this._info.search);
				} else {
					isReload = false;
				}
			}
			if (canPushHistory) {
				this._context.window.history._pushStack(url, "", {});
			}
			if (!isReload) {
				if (_info.hash !== this._info.hash) {
					this._context.window.onhashchange && this._context.window.onhashchange();
				}
				this._info = _info;
			} else {
				this._info = _info;
				if (canReload) {
					this.reload();
				}
			}
		}
	}

	_setUrl(url) {
		this._setHref(url, false, false);
	}
}

module.exports = Location;