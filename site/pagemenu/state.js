"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var _dec,_class,_adajs=require("adajs"),_arrow=_interopRequireDefault(require("site/pagemenu/icons/arrow.icon")),_menu=_interopRequireDefault(require("site/pagemenu/icons/menu.icon")),_git=_interopRequireDefault(require("site/pagemenu/icons/git.icon")),_npm=_interopRequireDefault(require("site/pagemenu/icons/npm.icon"));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}function _applyDecoratedDescriptor(e,r,i,t,l){var o={};return Object.keys(t).forEach(function(e){o[e]=t[e]}),o.enumerable=!!o.enumerable,o.configurable=!!o.configurable,("value"in o||o.initializer)&&(o.writable=!0),o=i.slice().reverse().reduce(function(i,t){return t(e,r,i)||i},o),l&&void 0!==o.initializer&&(o.value=o.initializer?o.initializer.call(l):void 0,o.initializer=void 0),void 0===o.initializer&&(Object.defineProperty(e,r,o),o=null),o}let PagemenuService=(_dec=(0,_adajs.action)("scroll"),_applyDecoratedDescriptor((_class=class extends _adajs.Service{defaultData(){return{title:"",desc:"",menu:[],close:!1,scroll:!1,loading:!1,arrowIcon:_arrow.default,menuIcon:_menu.default,gitIcon:_git.default,npmIcon:_npm.default}}onupdate(e,r){e.menu=r.menu,e.title=r.title,e.desc=r.desc,e.close=r.close,e.loading=r.loading}scroll(e,r){e.scroll=r}}).prototype,"scroll",[_dec],Object.getOwnPropertyDescriptor(_class.prototype,"scroll"),_class.prototype),_class);var _default=PagemenuService;exports.default=_default;