"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _arrow = _interopRequireDefault(require("site/pagemenu/icons/arrow.icon"));

var _menu = _interopRequireDefault(require("site/pagemenu/icons/menu.icon"));

var _git = _interopRequireDefault(require("site/pagemenu/icons/git.icon"));

var _npm = _interopRequireDefault(require("site/pagemenu/icons/npm.icon"));

var _dec, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let PagemenuService = (_dec = (0, _adajs.action)("scroll"), (_class = class PagemenuService extends _adajs.Service {
  defaultData() {
    return {
      title: "",
      desc: "",
      menu: [],
      close: false,
      scroll: false,
      loading: false,
      arrowIcon: _arrow.default,
      menuIcon: _menu.default,
      gitIcon: _git.default,
      npmIcon: _npm.default
    };
  }

  onupdate(current, data) {
    current.menu = data.menu;
    current.title = data.title;
    current.desc = data.desc;
    current.close = data.close;
    current.loading = data.loading;
  }

  scroll(current, scroll) {
    current.scroll = scroll;
  }

}, (_applyDecoratedDescriptor(_class.prototype, "scroll", [_dec], Object.getOwnPropertyDescriptor(_class.prototype, "scroll"), _class.prototype)), _class));
var _default = PagemenuService;
exports.default = _default;
//# sourceMappingURL=site/pagemenu/state.js.map