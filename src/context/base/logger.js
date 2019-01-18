class BaseLogger {
    constructor(context) {
        this._context = context;
        this._on = false;
    }

    get on() {
        return this._on;
    }

    set on(a) {
        this._on = a;
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