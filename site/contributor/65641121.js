"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var _dec,_class,_adajs=require("adajs"),_state=_interopRequireDefault(require("site/contributor/state.js"));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}let Contributor=(_dec=(0,_adajs.view)({className:"contributor",template:"site/contributor/template.html",style:"site/contributor/style.scss",dataset:{service:_state.default},module:"site/contributor/index.js"}))(_class=class extends _adajs.View{})||_class;var _default=Contributor;exports.default=_default;