import {Service, action, util} from "adajs";
import refreshCw from "./icons/refresh-cw.icon";

class LoadingService extends Service {
	defaultData() {
		return {
			icon: refreshCw,
			circle: true,
			color: "black",
			content: "loading..."
		}
	}

	@action("set")
	set(current, info) {
		return util.extend(current, info);
	}
}

export default LoadingService;