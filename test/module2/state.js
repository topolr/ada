import {Service, get, action} from "./../../index";

class Teststate extends Service {
	defaultData() {
		return {
			hello: "miao~"
		};
	}
}

export default Teststate;