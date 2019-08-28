"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

class SponsorsService extends _adajs.Service {
  defaultData() {
    return {
      sponsors: [{
        name: "北京天拓数信科技",
        photo: "bjttsx",
        url: "http://www.bjttsx.com"
      }]
    };
  }

}

var _default = SponsorsService;
exports.default = _default;
//# sourceMappingURL=site/sponsors/state.js.map