require("colors");
let BaseLogger = require("../base/logger");

class ServerLogger extends BaseLogger {
    log(...args) {
        if (this.isOn()) {
            console.log(...[...args].map(arg => arg.toString().grey));
        }
    }

    error(...args) {
        if (this.isOn()) {
            console.error(...[...args].map(arg => arg.toString().red));
        }
    }

    warn(...args) {
        console.warn(...[...args].map(arg => arg.toString().yellow));
    }

    info(...args) {
        console.info(...[...args].map(arg => arg.toString().white));
    }

    group() {
    }

    groupEnd() {
    }
}

module.exports = ServerLogger;