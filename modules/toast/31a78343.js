"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var _adajs=require("adajs");class ToaseService extends _adajs.Service{defaultData(){return{content:"this is toast"}}onupdate(e,t){return e.content=t.content,e}}var _default=ToaseService;exports.default=_default;