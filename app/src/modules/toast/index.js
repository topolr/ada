import {view, View} from "adajs";
import ToastService from "./state";

@view({
	className: "toast",
	template: "./template.html",
	style: "./style.scss",
	dataset: {
		service: ToastService
	}
})
class Toast extends View {
	onready() {
		this.getElement().style.marginLeft = `-${this.getElement().getBoundingClientRect().width / 2}px`;
		setTimeout(()=>{
			this.getElement().classList.add(this.getThisClassName("in"));
		},100);
		setTimeout(() => {
			this.getElement().classList.add(this.getThisClassName("out"));
			setTimeout(() => {
				this.getParent() && this.getParent().removeChild(this);
			}, 1500);
		}, 2000);
	}
}

export default Toast;