"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _ada = _interopRequireDefault(require("site/container/images/ada.icon"));

var _menu = _interopRequireDefault(require("menu.json"));

var _dec, _dec2, _dec3, _dec4, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let ContainerService = (_dec = (0, _adajs.action)("flip"), _dec2 = (0, _adajs.action)("close"), _dec3 = (0, _adajs.action)("open"), _dec4 = (0, _adajs.action)("setuserinfo"), (_class = class ContainerService extends _adajs.Service {
  defaultData() {
    return {
      menu: _menu.default,
      logo: _ada.default,
      page: "/",
      name: _menu.default[0].name,
      desc: _menu.default[0].desc,
      commentId: "",
      close: true,
      userInfo: {}
    };
  }

  flip(current, name) {
    current.menu.forEach(item => {
      if (item.link === name) {
        item.active = true;
        current.page = item.link;
        current.name = item.name;
        current.desc = item.desc;
        current.commentId = item.commentId;
      } else {
        item.active = false;
      }
    });
  }

  close(current) {
    current.close = true;
  }

  open(current) {
    current.close = false;
  }

  setUserInfo(current, info) {
    current.userInfo = info;
  }

}, (_applyDecoratedDescriptor(_class.prototype, "flip", [_dec], Object.getOwnPropertyDescriptor(_class.prototype, "flip"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "close", [_dec2], Object.getOwnPropertyDescriptor(_class.prototype, "close"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "open", [_dec3], Object.getOwnPropertyDescriptor(_class.prototype, "open"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "setUserInfo", [_dec4], Object.getOwnPropertyDescriptor(_class.prototype, "setUserInfo"), _class.prototype)), _class));
var _default = ContainerService;
exports.default = _default;
//# sourceMappingURL=site/container/state.js.map