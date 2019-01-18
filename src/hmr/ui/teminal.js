let teminalStyle = require("./style/teminal.less");
let teminalHtml = require("./template/teminal.html");
let {DDM} = require("./../../../src/base/ddm");

let teminal = {
	element: null,
	init() {
		teminalStyle.active();
	},
	showError(context, info) {
		this.hide();
		let a = context.document.createElement("div");
		a.setAttribute("class", "ada-hmr-teminal");
		context.document.body.appendChild(a);
		info.forEach(item => {
			if (item.info.stack) {
				item.info.stack = item.info.stack.split("\n");
			}
		});
		new DDM({
			id: "ada-hmr-teminal",
			container: a,
			binders: {},
			templateStr: teminalHtml,
			macro: {},
			className: "",
			context
		}).render({info});
		this.element = a;
	},
	hide() {
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
	}
};

module.exports = teminal;