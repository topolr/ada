"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var _dec,_class,_adajs=require("adajs"),_refreshCw=_interopRequireDefault(require("modules/loading/icons/refresh-cw.icon"));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}function _applyDecoratedDescriptor(e,r,t,i,a){var l={};return Object.keys(i).forEach(function(e){l[e]=i[e]}),l.enumerable=!!l.enumerable,l.configurable=!!l.configurable,("value"in l||l.initializer)&&(l.writable=!0),l=t.slice().reverse().reduce(function(t,i){return i(e,r,t)||t},l),a&&void 0!==l.initializer&&(l.value=l.initializer?l.initializer.call(a):void 0,l.initializer=void 0),void 0===l.initializer&&(Object.defineProperty(e,r,l),l=null),l}let LoadingService=(_dec=(0,_adajs.action)("set"),_applyDecoratedDescriptor((_class=class extends _adajs.Service{defaultData(){return{icon:_refreshCw.default,circle:!0,color:"black",content:"loading..."}}set(e,r){return _adajs.util.extend(e,r)}}).prototype,"set",[_dec],Object.getOwnPropertyDescriptor(_class.prototype,"set"),_class.prototype),_class);var _default=LoadingService;exports.default=_default;