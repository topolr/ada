"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _state = _interopRequireDefault(require("site/container/state.js"));

var _menu = _interopRequireDefault(require("site/menu/index.js"));

var _content = _interopRequireDefault(require("site/content/index.js"));

var _router2 = _interopRequireDefault(require("router.js"));

var _comment = _interopRequireDefault(require("lib/comment.js"));

var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let Container = (_dec = (0, _adajs.view)({  className: "container",  template:"site/container/template.html",  style:"site/container/style.scss",  dataset: {    service: _state.default  },module:"site/container/index.js"}), _dec2 = (0, _adajs.handler)("flip"), _dec3 = (0, _adajs.handler)("closewin"), _dec4 = (0, _adajs.handler)("openwin"), _dec5 = (0, _adajs.handler)("login"), _dec(_class = (_class2 = class Container extends _adajs.BondViewGroup {
  oncreated() {
    let comment = new _comment.default(this.context);
    this.className.add("close");

    if (window.location.href.indexOf("code=") !== -1) {
      window.history.replaceState({}, "", window.location.href.split("?")[0]);
    }

    comment.login().then(() => {
      this.commit("setuserinfo", comment.session.userinfo);
    }).catch(e => console.log(e));
    this.context.comment = comment;

    let _router = this.router = new _router2.default(this.context);

    this.getCurrentState().menu.forEach(item => {
      _router.bind(item.link === "/" ? "/" : item.link, e => {
        this.commit("flip", item.link);
      });
    });
  }

  onready() {
    this.router.run();
  }

  tags() {
    return {
      menu: _menu.default,
      content: _content.default
    };
  }

  flip({
    data
  }) {
    if (window.innerWidth <= 1000) {
      this.commit("close").then(() => this.router.open(data));
    } else {
      this.router.open(data);
    }
  }

  closeWin() {
    this.commit("close");
  }

  openWin() {
    this.commit("open");
  }

  login() {
    window.location.href = this.context.comment.getLoginURL();
  }

}, (_applyDecoratedDescriptor(_class2.prototype, "flip", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "flip"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "closeWin", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "closeWin"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "openWin", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "openWin"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "login", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "login"), _class2.prototype)), _class2)) || _class);
var _default = Container;
exports.default = _default;
//# sourceMappingURL=site/container/index.js.map