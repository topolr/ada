"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _refreshCw = _interopRequireDefault(require("modules/loading/icons/refresh-cw.icon"));

var _checkCircle = _interopRequireDefault(require("modules/loading/icons/check-circle.icon"));

var _minusCircle = _interopRequireDefault(require("modules/loading/icons/minus-circle.icon"));

var _state = _interopRequireDefault(require("modules/loading/state.js"));

require("modules/style/base.scss");

var _dec, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let Loading = (_dec = (0, _adajs.view)({  className: "loading",  template:"modules/loading/template.html",  style:"modules/loading/style.scss",  dataset: {    service: _state.default  },module:"modules/loading/index.js"}), _dec(_class = class Loading extends _adajs.View {
  oncreated() {
    setTimeout(() => {
      if (!this.isRemoved()) {
        this.getElement().classList.add(this.getThisClassName("in"));
      }
    }, 100);
  }

  showLoading(content) {
    this.getDataSet().commit("set", {
      icon: _refreshCw.default,
      circle: true,
      color: "black",
      content: content || "loading..."
    });
  }

  showSuccess(content) {
    this.getDataSet().commit("set", {
      icon: _checkCircle.default,
      circle: false,
      color: "green",
      content: content || "Success done"
    });
  }

  showError(content) {
    this.getDataSet().commit("set", {
      icon: _minusCircle.default,
      circle: false,
      color: "red",
      content: content || "Error occur"
    });
  }

  close(delay = 2000) {
    setTimeout(() => {
      if (!this.isRemoved()) {
        this.getElement().classList.remove(this.getThisClassName("in"));
        setTimeout(() => {
          this.getParent() && this.getParent().removeChild(this);
        }, 400);
      }
    }, delay);
  }

}) || _class);
var _default = Loading;
exports.default = _default;
//# sourceMappingURL=modules/loading/index.js.map