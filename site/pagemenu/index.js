"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _state = _interopRequireDefault(require("site/pagemenu/state.js"));

var _dispatcher = _interopRequireDefault(require("dispatcher.js"));

var _dec, _dec2, _dec3, _class, _class2;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let Pagemenu = (_dec = (0, _adajs.view)({  className: "pagemenu",  template:"site/pagemenu/template.html",  style:"site/pagemenu/style.scss",  dataset: {    service: _state.default  },module:"site/pagemenu/index.js"}), _dec2 = (0, _adajs.binder)("togglewin"), _dec3 = (0, _adajs.subscribe)("scroll"), _dec(_class = (_class2 = class Pagemenu extends _adajs.View {
  oncreated() {
    _dispatcher.default.observe(this);
  }

  togglewin() {
    if (this.getCurrentState().close) {
      this.dispatchEvent("openwin");
    } else {
      this.dispatchEvent("closewin");
    }
  }

  scroll() {
    let top = (window.document.scrollingElement || window.document.body).scrollTop;

    if (top > 120) {
      this.commit("scroll", true);
    } else {
      this.commit("scroll", false);
    }
  }

}, (_applyDecoratedDescriptor(_class2.prototype, "togglewin", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "togglewin"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "scroll", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "scroll"), _class2.prototype)), _class2)) || _class);
var _default = Pagemenu;
exports.default = _default;
//# sourceMappingURL=site/pagemenu/index.js.map