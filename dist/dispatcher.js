"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _debounce = _interopRequireDefault(require("node_modules/lodash/debounce.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class EventDispatcher extends _adajs.Dispatcher {
  constructor() {
    super();
    let scroll = (0, _debounce.default)(e => {
      window.requestAnimationFrame(() => {
        this.dispatch("scroll", e);
      });
    }, 50);
    window.addEventListener("scroll", e => {
      scroll(e);
    });
    window.document.body.addEventListener("click", e => {
      this.dispatch("click", e);
    });
  }

}

const eventDispatcher = new EventDispatcher();
var _default = eventDispatcher;
exports.default = _default;
//# sourceMappingURL=dispatcher.js.map