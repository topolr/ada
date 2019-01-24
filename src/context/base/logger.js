class BaseLogger {
	constructor(context) {
		this._context = context;
		this._on = context.window.localStorage['ada-logger-on'] === 'on';
	}

	get on() {
		return this._on;
	}

	set on(a) {
		this._on = a;
		this._context.window.localStorage['ada-logger-on'] = a ? 'on' : 'off';
	}

	log() {
	}

	error() {
	}

	warn() {
	}

	info() {
	}

	isOn() {
		return this._on === true;
	}

	group() {
	}

	groupEnd() {
	}
}

module.exports = BaseLogger;