"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

class ToaseService extends _adajs.Service {
  defaultData() {
    return {
      content: "this is toast"
    };
  }

  onupdate(current, info) {
    current.content = info.content;
    return current;
  }

}

var _default = ToaseService;
exports.default = _default;
//# sourceMappingURL=modules/toast/state.js.map