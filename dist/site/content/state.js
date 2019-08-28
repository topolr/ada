"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _dec, _dec2, _class;

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let ContentService = (_dec = (0, _adajs.action)("setmenu"), _dec2 = (0, _adajs.action)("getpage"), (_class = class ContentService extends _adajs.Service {
  defaultData() {
    return {
      url: "",
      title: "",
      desc: "",
      commentId: "",
      close: false,
      content: "",
      hash: "",
      menu: []
    };
  }

  onupdate(current, data) {
    current.url = data.url;
    current.title = data.title;
    current.desc = data.desc;
    current.close = data.close;
    current.commentId = data.commentId;
    current.hash = data.hash;
    return current;
  }

  setMenu(current, menu) {
    current.menu = menu;
  }

  getPage(current) {
    return this.request.get(`${this.context.config.basePath}docs${current.url}?h=${current.hash}`).then(content => {
      current.content = content;
    }).catch(e => {
      current.content = "";
    });
  }

}, (_applyDecoratedDescriptor(_class.prototype, "setMenu", [_dec], Object.getOwnPropertyDescriptor(_class.prototype, "setMenu"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "getPage", [_dec2], Object.getOwnPropertyDescriptor(_class.prototype, "getPage"), _class.prototype)), _class));
var _default = ContentService;
exports.default = _default;
//# sourceMappingURL=site/content/state.js.map