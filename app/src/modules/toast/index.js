import {view, View} from "adajs";
import ToastService from "./state";
import { template } from './template.html';
import { style } from './style.scss';

@view({
	className: "toast",
	template,
	style,
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