"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _state = _interopRequireDefault(require("site/reply/state.js"));

var _toast = _interopRequireDefault(require("modules/toast/index.js"));

var _loading = _interopRequireDefault(require("modules/loading/index.js"));

var _dec, _dec2, _dec3, _dec4, _class, _class2;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let Reply = (_dec = (0, _adajs.view)({  className: "reply",  template:"site/reply/template.html",  style:"site/reply/style.scss",  dataset: {    service: _state.default  },module:"site/reply/index.js"}), _dec2 = (0, _adajs.binder)("close"), _dec3 = (0, _adajs.binder)("login"), _dec4 = (0, _adajs.binder)("reply"), _dec(_class = (_class2 = class Reply extends _adajs.BondViewGroup {
  oncreated() {
    setTimeout(() => {
      this.className.add("open");
    });
  }

  close() {
    this.closePannel();
  }

  login() {
    this.dispatchEvent("login");
  }

  reply() {
    let text = this.finder("input").getElement().innerHTML;

    if (text.trim().length > 0) {
      this.addChild(_loading.default).then(loading => {
        this.commit("reply", text).then(() => {
          loading.showSuccess();
          loading.close();
          setTimeout(() => {
            this.closePannel();
            this.dispatchEvent("commentdone");
          }, 2000);
        });
      });
    } else {
      this.addChild(_toast.default, {
        parameter: {
          content: "reply content can not empty"
        }
      });
    }
  }

  closePannel() {
    this.className.remove("open");
    setTimeout(() => {
      this.dispatchEvent("closereply");
    }, 500);
  }

}, (_applyDecoratedDescriptor(_class2.prototype, "close", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "close"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "login", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "login"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "reply", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "reply"), _class2.prototype)), _class2)) || _class);
var _default = Reply;
exports.default = _default;
//# sourceMappingURL=site/reply/index.js.map