let {isBrowser} = require("../../util/helper");

let util = {
	isServer: false,
	setSourcePaths(info) {
	},
	isRegularTag(tagName) {
		if (isBrowser()) {
			let a = window.document.createElement(tagName);
			return a instanceof window.HTMLElement || a instanceof window.SVGElement;
		} else {
			return true;
		}
	}
};

module.exports = util;