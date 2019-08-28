"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _state = _interopRequireDefault(require("site/comment/state.js"));

var _dec, _dec2, _class, _class2;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let Comment = (_dec = (0, _adajs.view)({  className: "comment",  template:"site/comment/template.html",  style:"site/comment/style.scss",  dataset: {    service: _state.default  },module:"site/comment/index.js"}), _dec2 = (0, _adajs.binder)("open"), _dec(_class = (_class2 = class Comment extends _adajs.ViewGroup {
  onready() {
    if (this.context.isBrowser) {
      this.commit("get");
    }
  }

  onbeforecommit(type) {
    if (type === "get") {
      this.finder("loader").getElement().style.display = "block";
    }
  }

  oncommited(type) {
    if (type === "get") {
      this.finder("loader").getElement().style.display = "none";
    }
  }

  open() {
    this.dispatchEvent("openreply");
  }

  onrecover() {
    this.commit("get");
  }

}, (_applyDecoratedDescriptor(_class2.prototype, "open", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "open"), _class2.prototype)), _class2)) || _class);
var _default = Comment;
exports.default = _default;
//# sourceMappingURL=site/comment/index.js.map