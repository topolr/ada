"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var _adajs=require("adajs");class EventDispatcher extends _adajs.Dispatcher{constructor(){super(),window.addEventListener("scroll",e=>{window.requestAnimationFrame(()=>{this.dispatch("scroll",e)})}),window.document.body.addEventListener("click",e=>{this.dispatch("click",e)})}}const eventDispatcher=new EventDispatcher;var _default=eventDispatcher;exports.default=_default;