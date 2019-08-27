import {view, View} from "adajs";
import refreshCw from "./icons/refresh-cw.icon";
import checkCircle from "./icons/check-circle.icon";
import minusCircle from "./icons/minus-circle.icon";
import LoadingService from "./state";
import "../style/base.scss";

@view({
	className: "loading",
	template: "./template.html",
	style: "./style.scss",
	dataset: {
		service: LoadingService
	}
})

class Loading extends View {
	oncreated() {
		setTimeout(() => {
			if (!this.isRemoved()) {
				this.getElement().classList.add(this.getThisClassName("in"));
			}
		}, 100);
	}

	showLoading(content) {
		this.getDataSet().commit("set", {
			icon: refreshCw,
			circle: true,
			color: "black",
			content: content || "loading..."
		});
	}

	showSuccess(content) {
		this.getDataSet().commit("set", {
			icon: checkCircle,
			circle: false,
			color: "green",
			content: content || "Success done"
		});
	}

	showError(content) {
		this.getDataSet().commit("set", {
			icon: minusCircle,
			circle: false,
			color: "red",
			content: content || "Error occur"
		});
	}

	close(delay = 2000) {
		setTimeout(() => {
			if (!this.isRemoved()) {
				this.getElement().classList.remove(this.getThisClassName("in"));
				setTimeout(() => {
					this.getParent() && this.getParent().removeChild(this);
				}, 400);
			}
		}, delay);
	}
}

export default Loading;