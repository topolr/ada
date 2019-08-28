"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _state = _interopRequireDefault(require("modules/lazyimage/state.js"));

var _dispatcher = _interopRequireDefault(require("modules/dispatcher.js"));

require("modules/style/base.scss");

var _dec, _dec2, _class, _class2;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let Lazyimage = (_dec = (0, _adajs.view)({  className: "lazyimage",  template:"modules/lazyimage/template.html",  style:"modules/lazyimage/style.scss",  dataset: {    service: _state.default  },module:"modules/lazyimage/index.js"}), _dec2 = (0, _adajs.subscribe)("scroll"), _dec(_class = (_class2 = class Lazyimage extends _adajs.View {
  oncreated() {
    if (this.context.isBrowser) {
      _dispatcher.default.observe(this);

      setTimeout(() => this.scroll());
    }
  }

  onready() {
    if (!this.context.isBrowser) {
      this.finder("image").getElement().innerHTML = `<img src="${this.getCurrentState().url}"/>`;
    }
  }

  scroll() {
    let height = document.documentElement.clientHeight;
    let top = this.getElement().getBoundingClientRect().top;

    if (top <= height) {
      this.loadImage();
    }
  }

  loadImage() {
    let state = this.getCurrentState();

    if (state.url && !state.loaded) {
      let image = document.createElement("img");
      image.addEventListener("load", () => {
        let target = this.finder("image").getElement();
        target.innerHTML = "";
        target.appendChild(image);

        _dispatcher.default.unobserve(this);

        this.commit("loaded", true);
      });
      image.setAttribute("src", state.url);
    }
  }

  onrecover() {
    _dispatcher.default.observe(this);

    setTimeout(() => this.scroll());
  }

}, (_applyDecoratedDescriptor(_class2.prototype, "scroll", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "scroll"), _class2.prototype)), _class2)) || _class);
var _default = Lazyimage;
exports.default = _default;
//# sourceMappingURL=modules/lazyimage/index.js.map