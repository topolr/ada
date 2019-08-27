import {Service, action} from "adajs";
import refreshIcon from "./icons/refresh-cw.icon";

class LazyimageService extends Service {
	defaultData() {
		return {
			url: "",
			loaded: false,
			refreshIcon
		};
	}

	onupdate(current, data) {
		current.url = data.url;
		current.loaded = false;
		return current;
	}

	@action("loaded")
	loaded(current, state) {
		current.loaded = state;
		return current;
	}
}

export default LazyimageService;
