import {binder, View, view, subscribe} from "adajs";
import PagemenuService from "./state.js";
import dispatcher from "./../../dispatcher";

@view({
	className: "pagemenu",
	template: "./template.html",
	style: "./style.scss",
	dataset: {
		service: PagemenuService
	}
})
class Pagemenu extends View {
	oncreated() {
		dispatcher.observe(this);
	}

	@binder("togglewin")
	togglewin() {
		if (this.getCurrentState().close) {
			this.dispatchEvent("openwin");
		} else {
			this.dispatchEvent("closewin");
		}
	}

	@subscribe("scroll")
	scroll() {
		let top = (window.document.scrollingElement || window.document.body).scrollTop;
		if (top > 120) {
			this.commit("scroll", true);
		} else {
			this.commit("scroll", false);
		}
	}
}

export default Pagemenu;
