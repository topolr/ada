let {View} = require("./view");
let {SUBSCRIBE} = require("./util/const");

class Dispatcher {
	constructor() {
		this._listener = [];
	}

	observe(view) {
		if (view instanceof View) {
			if (this._listener.indexOf(view) === -1) {
				this._listener.push(view);
			}
		}
		return this;
	}

	unobserve(view) {
		let index = this._listener.indexOf(view);
		if (index !== -1) {
			this._listener.splice(index, 1);
		}
		return this;
	}

	dispatch(type, data) {
		this._listener.forEach(view => {
			if (!view.isRemoved()) {
				let info = view[SUBSCRIBE];
				let _method = info[type];
				try {
					if (_method && view[_method]) {
						view[_method](data);
					}
				} catch (e) {
					console.error("[ada] dispatcher subscriber call error ", e);
				}
			}
		});
		this._listener = this._listener.filter(view => !view.isRemoved());
	}
}

module.exports = {Dispatcher};