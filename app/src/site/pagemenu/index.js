import {binder, View, view, subscribe} from "adajs";
import PagemenuService from "./state.js";
import dispatcher from "./../../dispatcher";
import { template } from './template.html';
import { style } from './style.scss';

@view({
	className: "pagemenu",
	template,
	style,
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
