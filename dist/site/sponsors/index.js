"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var _dec,_class,_adajs=require("adajs"),_state=_interopRequireDefault(require("site/sponsors/state.js"));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}let Sponsors=(_dec=(0,_adajs.view)({className:"sponsors",template:"site/sponsors/template.html",style:"site/sponsors/style.scss",dataset:{service:_state.default},module:"site/sponsors/index.js"}))(_class=class extends _adajs.View{})||_class;var _default=Sponsors;exports.default=_default;