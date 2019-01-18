class History {
	constructor(context, url) {
		this._stack = [{
			data: null,
			title: null,
			url
		}];
		this._context = context;
		this._current = 0;
	}

	get length() {
		return this._stack.length;
	}

	back() {
		this.go(1);
	}

	forward() {
		this.go(-1);
	}

	go(n) {
		let index = this._current + n;
		if (index >= 0 && index < this._stack.length) {
			this._current = index;
			let a = this._stack[index];
			this._context.window.location._setHref(a.url, true, false);
		}
	}

	pushState(data, title, url) {
		this._stack.unshift({
			data: data,
			title: title,
			url: url
		});
		let a = this._stack[0];
		this._context.window.location._setUrl(url);
		this._context.window.onpopstate && this._context.window.onpopstate({
			state: a.data,
			title: a.title
		});
	}

	replaceState(data, title, url) {
		this._stack[0] = {
			data: data,
			title: title,
			url: url
		};
		let a = this._stack[0];
		this._context.window.location._setUrl(url);
		this._context.window.onpopstate && this._context.window.onpopstate({
			state: a.data,
			title: a.title
		});
	}

	_pushStack(url, title, data) {
		this._stack.unshift({url, data, title});
	}
}

module.exports = History;