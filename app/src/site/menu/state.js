import {Service} from "adajs";

class MenuService extends Service {
	defaultData() {
		return {
			list: [],
			close: false
		};
	}

	onupdate(current, data) {
		current.list = data.list;
		current.close = data.close;
		return current;
	}
}

export default MenuService;
