"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _container = _interopRequireDefault(require("site/container/index.js"));

require("style/reset.scss");

require("icons/index.js");

var _dec, _class;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let Root = (_dec = (0, _adajs.root)({root:true,module:"root.js"}), _dec(_class = class Root extends _adajs.StaticViewGroup {
  onready() {
    if (this.context.isBrowser) {
      let s = this.context.document.createElement("script");
      s.setAttribute("src", "https://www.googletagmanager.com/gtag/js?id=UA-128443242-1");
      s.addEventListener("load", () => {
        this.context.window.dataLayer = window.dataLayer || [];

        function gtag() {
          dataLayer.push(arguments);
        }

        gtag('js', new Date());
        gtag('config', 'UA-128443242-1');
      });
      this.context.document.head.appendChild(s);
    }

    this.addChild(_container.default);
  }

}) || _class);
var _default = Root;
exports.default = _default;
//# sourceMappingURL=root.js.map