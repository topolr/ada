"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _state = _interopRequireDefault(require("site/sponsors/state.js"));

var _dec, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let Sponsors = (_dec = (0, _adajs.view)({  className: "sponsors",  template:"site/sponsors/template.html",  style:"site/sponsors/style.scss",  dataset: {    service: _state.default  },module:"site/sponsors/index.js"}), _dec(_class = class Sponsors extends _adajs.View {}) || _class);
var _default = Sponsors;
exports.default = _default;
//# sourceMappingURL=site/sponsors/index.js.map