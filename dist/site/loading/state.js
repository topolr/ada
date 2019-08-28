"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

class LoadingService extends _adajs.Service {
  defaultData() {
    return {};
  }

  onupdate(current, data) {
    return current;
  }

}

var _default = LoadingService;
exports.default = _default;
//# sourceMappingURL=site/loading/state.js.map