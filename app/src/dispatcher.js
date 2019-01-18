import {Dispatcher} from "adajs";
import throttle from "lodash/debounce";

class EventDispatcher extends Dispatcher {
	constructor() {
		super();
		let scroll = throttle((e) => {
			window.requestAnimationFrame(() => {
				this.dispatch("scroll", e);
			});
		}, 50);
		window.addEventListener("scroll", e => {
			scroll(e);
		});
		window.document.body.addEventListener("click", e => {
			this.dispatch("click", e);
		});
	}
}

const eventDispatcher = new EventDispatcher();

export default eventDispatcher;