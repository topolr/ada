let BaseLogger = require("../base/logger");

class BrowserLogger extends BaseLogger {
    log(...args) {
        if (this.isOn()) {
            console.log(...args);
        }
    }

    error(...args) {
        if (this.isOn()) {
            console.error(...args);
        }
    }

    warn(...args) {
        console.warn(...args);
    }

    info(...args) {
        console.info(...args);
    }

    group(a) {
        if (this.isOn()) {
            console.group(a);
        }
    }

    groupEnd() {
        if (this.isOn()) {
            console.groupEnd();
        }
    }
}

module.exports = BrowserLogger;