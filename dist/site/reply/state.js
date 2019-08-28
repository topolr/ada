"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _add = _interopRequireDefault(require("site/reply/icons/add.icon"));

var _git = _interopRequireDefault(require("site/reply/icons/git.icon"));

var _dec, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let ReplyService = (_dec = (0, _adajs.action)("reply"), (_class = class ReplyService extends _adajs.Service {
  defaultData() {
    return {
      addIcon: _add.default,
      gitIcon: _git.default,
      info: {},
      commentId: ""
    };
  }

  onupdate(current, data) {
    _adajs.util.extend(current, data);

    return current;
  }

  reply(current, data) {
    return this.context.comment.comment(current.commentId, data).then(() => current);
  }

}, (_applyDecoratedDescriptor(_class.prototype, "reply", [_dec], Object.getOwnPropertyDescriptor(_class.prototype, "reply"), _class.prototype)), _class));
var _default = ReplyService;
exports.default = _default;
//# sourceMappingURL=site/reply/state.js.map