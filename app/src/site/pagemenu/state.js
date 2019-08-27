import {Service, action} from "adajs";
import arrowIcon from "./icons/arrow.icon";
import menuIcon from "./icons/menu.icon";
import gitIcon from "./icons/git.icon";
import npmIcon from "./icons/npm.icon";

class PagemenuService extends Service {
	defaultData() {
		return {
			title: "",
			desc: "",
			menu: [],
			close: false,
			scroll: false,
			loading:false,
			arrowIcon,
			menuIcon,
			gitIcon,
			npmIcon
		};
	}

	onupdate(current, data) {
		current.menu = data.menu;
		current.title = data.title;
		current.desc = data.desc;
		current.close = data.close;
		current.loading=data.loading;
	}

	@action("scroll")
	scroll(current, scroll) {
		current.scroll = scroll;
	}
}

export default PagemenuService;
