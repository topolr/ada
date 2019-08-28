"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _state = _interopRequireDefault(require("modules/toast/state.js"));

var _dec, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let Toast = (_dec = (0, _adajs.view)({  className: "toast",  template:"modules/toast/template.html",  style:"modules/toast/style.scss",  dataset: {    service: _state.default  },module:"modules/toast/index.js"}), _dec(_class = class Toast extends _adajs.View {
  onready() {
    this.getElement().style.marginLeft = `-${this.getElement().getBoundingClientRect().width / 2}px`;
    setTimeout(() => {
      this.getElement().classList.add(this.getThisClassName("in"));
    }, 100);
    setTimeout(() => {
      this.getElement().classList.add(this.getThisClassName("out"));
      setTimeout(() => {
        this.getParent() && this.getParent().removeChild(this);
      }, 1500);
    }, 2000);
  }

}) || _class);
var _default = Toast;
exports.default = _default;
//# sourceMappingURL=modules/toast/index.js.map