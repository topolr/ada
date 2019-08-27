"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var _dec,_dec2,_dec3,_dec4,_dec5,_class,_class2,_adajs=require("adajs"),_state=_interopRequireDefault(require("site/container/state.js")),_menu=_interopRequireDefault(require("site/menu/index.js")),_content=_interopRequireDefault(require("site/content/index.js")),_router2=_interopRequireDefault(require("router.js")),_comment=_interopRequireDefault(require("lib/comment.js"));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}function _applyDecoratedDescriptor(e,t,o,r,i){var n={};return Object.keys(r).forEach(function(e){n[e]=r[e]}),n.enumerable=!!n.enumerable,n.configurable=!!n.configurable,("value"in n||n.initializer)&&(n.writable=!0),n=o.slice().reverse().reduce(function(o,r){return r(e,t,o)||o},n),i&&void 0!==n.initializer&&(n.value=n.initializer?n.initializer.call(i):void 0,n.initializer=void 0),void 0===n.initializer&&(Object.defineProperty(e,t,n),n=null),n}let Container=(_dec=(0,_adajs.view)({className:"container",template:"site/container/template.html",style:"site/container/style.scss",dataset:{service:_state.default},module:"site/container/index.js"}),_dec2=(0,_adajs.handler)("flip"),_dec3=(0,_adajs.handler)("closewin"),_dec4=(0,_adajs.handler)("openwin"),_dec5=(0,_adajs.handler)("login"),_dec((_applyDecoratedDescriptor((_class2=class extends _adajs.BondViewGroup{oncreated(){console.log("======>xxx");let e=new _comment.default(this.context);this.className.add("close"),-1!==window.location.href.indexOf("code=")&&window.history.replaceState({},"",window.location.href.split("?")[0]),e.login().then(()=>{this.commit("setuserinfo",e.session.userinfo)}).catch(e=>console.log(e)),this.context.comment=e;let t=this.router=new _router2.default(this.context);this.getCurrentState().menu.forEach(e=>{t.bind("/"===e.link?"/":e.link,t=>{this.commit("flip",e.link)})})}onready(){this.router.run()}tags(){return{menu:_menu.default,content:_content.default}}flip({data:e}){window.innerWidth<=1e3?this.commit("close").then(()=>this.router.open(e)):this.router.open(e)}closeWin(){this.commit("close")}openWin(){this.commit("open")}login(){window.location.href=this.context.comment.getLoginURL()}}).prototype,"flip",[_dec2],Object.getOwnPropertyDescriptor(_class2.prototype,"flip"),_class2.prototype),_applyDecoratedDescriptor(_class2.prototype,"closeWin",[_dec3],Object.getOwnPropertyDescriptor(_class2.prototype,"closeWin"),_class2.prototype),_applyDecoratedDescriptor(_class2.prototype,"openWin",[_dec4],Object.getOwnPropertyDescriptor(_class2.prototype,"openWin"),_class2.prototype),_applyDecoratedDescriptor(_class2.prototype,"login",[_dec5],Object.getOwnPropertyDescriptor(_class2.prototype,"login"),_class2.prototype),_class=_class2))||_class);var _default=Container;exports.default=_default;