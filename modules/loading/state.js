"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _refreshCw = _interopRequireDefault(require("modules/loading/icons/refresh-cw.icon"));

var _dec, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let LoadingService = (_dec = (0, _adajs.action)("set"), (_class = class LoadingService extends _adajs.Service {
  defaultData() {
    return {
      icon: _refreshCw.default,
      circle: true,
      color: "black",
      content: "loading..."
    };
  }

  set(current, info) {
    return _adajs.util.extend(current, info);
  }

}, (_applyDecoratedDescriptor(_class.prototype, "set", [_dec], Object.getOwnPropertyDescriptor(_class.prototype, "set"), _class.prototype)), _class));
var _default = LoadingService;
exports.default = _default;
//# sourceMappingURL=modules/loading/state.js.map