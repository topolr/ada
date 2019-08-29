"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var _dec,_class,_adajs=require("adajs"),_refreshCw=_interopRequireDefault(require("modules/loading/icons/refresh-cw.icon")),_checkCircle=_interopRequireDefault(require("modules/loading/icons/check-circle.icon")),_minusCircle=_interopRequireDefault(require("modules/loading/icons/minus-circle.icon")),_state=_interopRequireDefault(require("modules/loading/state.js"));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}require("modules/style/base.scss");let Loading=(_dec=(0,_adajs.view)({className:"loading",template:"modules/loading/template.html",style:"modules/loading/style.scss",dataset:{service:_state.default},module:"modules/loading/index.js"}))(_class=class extends _adajs.View{oncreated(){setTimeout(()=>{this.isRemoved()||this.getElement().classList.add(this.getThisClassName("in"))},100)}showLoading(e){this.getDataSet().commit("set",{icon:_refreshCw.default,circle:!0,color:"black",content:e||"loading..."})}showSuccess(e){this.getDataSet().commit("set",{icon:_checkCircle.default,circle:!1,color:"green",content:e||"Success done"})}showError(e){this.getDataSet().commit("set",{icon:_minusCircle.default,circle:!1,color:"red",content:e||"Error occur"})}close(e=2e3){setTimeout(()=>{this.isRemoved()||(this.getElement().classList.remove(this.getThisClassName("in")),setTimeout(()=>{this.getParent()&&this.getParent().removeChild(this)},400))},e)}})||_class;var _default=Loading;exports.default=_default;