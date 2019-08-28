"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _add = _interopRequireDefault(require("site/comment/icons/add.icon"));

var _dec, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let CommentService = (_dec = (0, _adajs.action)("get"), (_class = class CommentService extends _adajs.Service {
  defaultData() {
    return {
      commentId: "",
      infos: [],
      addIcon: _add.default,
      loading: true
    };
  }

  onupdate(current, data) {
    current.commentId = data.commentId;
  }

  get(current) {
    return this.context.comment.getIssueCommentsById(current.commentId).then(info => {
      current.infos = (info || []).map(info => {
        return {
          id: info.id,
          content: info.body,
          time: info.updated_at,
          userIcon: info.user.avatar_url,
          userPage: `https://github.com/${info.user.login}`,
          userId: info.user.id,
          userName: info.user.login
        };
      });
      return current.infos.reduce((a, info) => {
        return a.then(() => {
          return this.context.comment.getMarkdownContent(info.content).then(a => {
            info.content = a;
          });
        });
      }, Promise.resolve()).then(() => {
        current.loading = false;
      });
    });
  }

}, (_applyDecoratedDescriptor(_class.prototype, "get", [_dec], Object.getOwnPropertyDescriptor(_class.prototype, "get"), _class.prototype)), _class));
var _default = CommentService;
exports.default = _default;
//# sourceMappingURL=site/comment/state.js.map