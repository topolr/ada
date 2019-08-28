"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

class ContributorService extends _adajs.Service {
  defaultData() {
    return {
      contributors: [{
        name: "topolr",
        photo: "19883616"
      }, {
        name: "hou80houzhu",
        photo: "3970708"
      }, {
        name: "feinno-tang",
        photo: "27753028"
      }]
    };
  }

}

var _default = ContributorService;
exports.default = _default;
//# sourceMappingURL=site/contributor/state.js.map