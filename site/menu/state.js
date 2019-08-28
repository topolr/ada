"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

class MenuService extends _adajs.Service {
  defaultData() {
    return {
      list: [],
      close: false
    };
  }

  onupdate(current, data) {
    current.list = data.list;
    current.close = data.close;
  }

}

var _default = MenuService;
exports.default = _default;
//# sourceMappingURL=site/menu/state.js.map