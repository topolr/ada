class Event {
	constructor() {
		this._listener = {};
	}

	addEventListener(type, fn) {
		if (!this._listener[type]) {
			this._listener[type] = [];
		}
		if (this._listener[type].indexOf(fn) === -1) {
			this._listener[type].push(fn);
		}
	}

	removeEventListener(type, fn) {
		if (this._listener[type]) {
			let index = this._listener[type].indexOf(fn);
			if (index !== -1) {
				this._listener[type].splice(index, 1);
			}
		}
	}

	_triggerEvent(event) {
		let type = event.type;
		if (this._listener[type]) {
			this._listener[type].forEach(fn => fn(event));
		}
	}

	_createEvent(type, info) {
		return {type, info};
	}
}

module.exports = Event;