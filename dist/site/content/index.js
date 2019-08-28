"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _adajs = require("adajs");

var _state = _interopRequireDefault(require("site/content/state.js"));

var _pagemenu = _interopRequireDefault(require("site/pagemenu/index.js"));

var _loading = _interopRequireDefault(require("site/loading/index.js"));

var _prism = _interopRequireDefault(require("lib/prism.js"));

var _comment = _interopRequireDefault(require("site/comment/index.js"));

var _connector = _interopRequireDefault(require("site/connector/index.js"));

require("lib/prism.css");

var _dec, _dec2, _dec3, _dec4, _class, _class2;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

let Content = (_dec = (0, _adajs.view)({  className: "content",  template:"site/content/template.html",  style:"site/content/style.scss",  dataset: {    service: _state.default  },module:"site/content/index.js"}), _dec2 = (0, _adajs.handler)("openreply"), _dec3 = (0, _adajs.handler)("closereply"), _dec4 = (0, _adajs.handler)("commentdone"), _dec(_class = (_class2 = class Content extends _adajs.StaticViewGroup {
  oncreated() {
    window.document.body.scrollTop = 0;
    this.getElement().style.minHeight = window.innerHeight + "px";
  }

  onready() {
    let data = this.getCurrentState();
    this.addChild(_loading.default, {
      name: "loading",
      container: this.finder("page").getElement()
    });
    this.addChild(_pagemenu.default, {
      name: "menu",
      parameter: {
        menu: data.menu,
        title: data.title,
        desc: data.desc,
        close: data.close,
        loading: !data.content
      },
      container: this.finder("head").getElement()
    });
    this.commit("getpage").then(() => {
      if (!this.isRemoved()) {
        let h2s = [];
        [...this.getElement().querySelectorAll("h2")].forEach(element => {
          h2s.push({
            title: element.innerText,
            id: element.getAttribute("id"),
            subs: []
          });
        });
        [...this.getElement().querySelectorAll("h3")].forEach(element => {
          let a = element;

          while (a) {
            if (a.tagName && a.tagName.toLowerCase() === "h2") {
              break;
            } else {
              a = a.previousSibling;
            }
          }

          if (a && a.tagName && a.tagName.toLowerCase() === "h2") {
            h2s.some(info => {
              if (info.element === a) {
                info.subs.push({
                  title: element.innerText,
                  id: element.getAttribute("id")
                });
                return true;
              }
            });
          }
        });

        if (this.getCurrentState().content) {
          this.removeChildByName("loading");
        }

        this.commit("setmenu", h2s).then(() => {
          if (this.context.isBrowser) {
            _prism.default.highlightAllUnder(this.getElement());
          }

          this.autoLoadModule().then(() => {
            this.context.snapshot();
          });
        });
      }
    });
  }

  tags() {
    return {
      pagemenu: _pagemenu.default,
      loading: _loading.default
    };
  }

  oncommited() {
    let menu = this.getChildByName("menu");

    if (menu) {
      let data = this.getCurrentState();
      menu.update({
        menu: data.menu,
        title: data.title,
        desc: data.desc,
        close: data.close,
        loading: !data.content
      });
    }

    if (this.getCurrentState().commentId && !this._at) {
      this._at = true;
      this.addChild(_comment.default, {
        name: "comment",
        parameter: {
          commentId: this.getCurrentState().commentId
        },
        container: this.finder("comment").getElement()
      });
    }
  }

  autoLoadModule() {
    return [...this.getElement().querySelectorAll(".ada-module")].reduce((a, element) => {
      return a.then(() => {
        let type = element.dataset.type,
            option = element.dataset.option ? JSON.parse(element.dataset.option) : {};
        return imports(type).then(module => {
          return this.addChild(module, {
            parameter: option,
            container: element
          });
        });
      });
    }, Promise.resolve());
  }

  openReply() {
    this.addChild(_connector.default, {
      name: "reply",
      parameter: {
        commentId: this.getCurrentState().commentId
      }
    });
  }

  closeReply() {
    this.removeChildByName("reply");
  }

  commentDone() {
    this.getChildByName("comment").commit("get");
  }

  onrecover() {
    _prism.default.highlightAllUnder(this.getElement());
  }

}, (_applyDecoratedDescriptor(_class2.prototype, "openReply", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "openReply"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "closeReply", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "closeReply"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "commentDone", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "commentDone"), _class2.prototype)), _class2)) || _class);
var _default = Content;
exports.default = _default;
//# sourceMappingURL=site/content/index.js.map