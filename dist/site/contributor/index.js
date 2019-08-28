"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _state = _interopRequireDefault(require("site/contributor/state.js"));

var _dec, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let Contributor = (_dec = (0, _adajs.view)({  className: "contributor",  template:"site/contributor/template.html",  style:"site/contributor/style.scss",  dataset: {    service: _state.default  },module:"site/contributor/index.js"}), _dec(_class = class Contributor extends _adajs.View {}) || _class);
var _default = Contributor;
exports.default = _default;
//# sourceMappingURL=site/contributor/index.js.map