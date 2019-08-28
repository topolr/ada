"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _state = _interopRequireDefault(require("site/loading/state.js"));

var _dec, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let Loading = (_dec = (0, _adajs.view)({  className: "loading",  template:"site/loading/template.html",  style:"site/loading/style.scss",  dataset: {    service: _state.default  },module:"site/loading/index.js"}), _dec(_class = class Loading extends _adajs.View {}) || _class);
var _default = Loading;
exports.default = _default;
//# sourceMappingURL=site/loading/index.js.map