let teminalStyle = require("./style/teminal.less");
let teminalHtml = require("./template/teminal.html");
let { DDM } = require("./../../../src/base/ddm");

let teminal = {
	element: null,
	error: {},
	init() {
		teminalStyle.active();
	},
	showError(context, app, info) {
		this.hide();
		this.error[app] = info;
		let list = [];
		Reflect.ownKeys(this.error).forEach(a => {
			list.push(...this.error[a]);
		});
		info.forEach(item => {
			if (item.info.stack) {
				item.info.stack = item.info.stack.split("\n");
			}
		});
		if (list.length > 0) {
			let a = context.document.createElement("div");
			a.setAttribute("class", "ada-hmr-teminal");
			context.document.body.appendChild(a);
			new DDM({
				id: "ada-hmr-teminal",
				container: a,
				binders: {},
				templateStr: teminalHtml,
				macro: {},
				className: "",
				context
			}).render({ info: list });
			this.element = a;
		}
	},
	hide() {
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
	}
};

module.exports = teminal;