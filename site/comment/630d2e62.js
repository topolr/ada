"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var _dec,_class,_adajs=require("adajs"),_add=_interopRequireDefault(require("site/comment/icons/add.icon"));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}function _applyDecoratedDescriptor(e,t,r,i,n){var o={};return Object.keys(i).forEach(function(e){o[e]=i[e]}),o.enumerable=!!o.enumerable,o.configurable=!!o.configurable,("value"in o||o.initializer)&&(o.writable=!0),o=r.slice().reverse().reduce(function(r,i){return i(e,t,r)||r},o),n&&void 0!==o.initializer&&(o.value=o.initializer?o.initializer.call(n):void 0,o.initializer=void 0),void 0===o.initializer&&(Object.defineProperty(e,t,o),o=null),o}let CommentService=(_dec=(0,_adajs.action)("get"),_applyDecoratedDescriptor((_class=class extends _adajs.Service{defaultData(){return{commentId:"",infos:[],addIcon:_add.default,loading:!0}}onupdate(e,t){return e.commentId=t.commentId,e}get(e){return this.context.comment.getIssueCommentsById(e.commentId).then(t=>(e.infos=t.map(e=>({id:e.id,content:e.body,time:e.updated_at,userIcon:e.user.avatar_url,userPage:`https://github.com/${e.user.login}`,userId:e.user.id,userName:e.user.login})),e.infos.reduce((e,t)=>e.then(()=>this.context.comment.getMarkdownContent(t.content).then(e=>{t.content=e})),Promise.resolve()).then(()=>(e.loading=!1,e))))}}).prototype,"get",[_dec],Object.getOwnPropertyDescriptor(_class.prototype,"get"),_class.prototype),_class);var _default=CommentService;exports.default=_default;