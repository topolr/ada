"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _reply = _interopRequireDefault(require("site/reply/index.js"));

var _state = _interopRequireDefault(require("site/container/state.js"));

var _dec, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let Connector = (_dec = (0, _adajs.view)({  className: "connector",  template:"site/connector/template.html",  style:"site/connector/style.scss",module:"site/connector/index.js"}), _dec(_class = class Connector extends _adajs.ViewConnector {
  setContextDataSets(connect) {
    let userInfo = connect(_state.default, current => {
      return current.userInfo;
    }, (current, data) => {
      current.userInfo = data;
    });
    return {
      userInfo,
      commentId: ""
    };
  }

  onupdate(current, data) {
    current.commentId = data.commentId;
    return current;
  }

  tags() {
    return {
      reply: _reply.default
    };
  }

}) || _class);
var _default = Connector;
exports.default = _default;
//# sourceMappingURL=site/connector/index.js.map