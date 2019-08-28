import {action, Service} from "adajs";

class ContentService extends Service {
	defaultData() {
		return {
			url: "",
			title: "",
			desc: "",
			commentId: "",
			close: false,
			content: "",
			hash: "",
			menu: []
		};
	}

	onupdate(current, data) {
		current.url = data.url;
		current.title = data.title;
		current.desc = data.desc;
		current.close = data.close;
		current.commentId = data.commentId;
		current.hash = data.hash;
		return current;
	}

	@action("setmenu")
	setMenu(current, menu) {
		current.menu = menu;
	}

	@action("getpage")
	getPage(current) {
		return this.request.get(`${this.context.config.basePath}docs${current.url}?h=${current.hash}`).then(content => {
			current.content = content;
		}).catch((e) => {
			current.content = "";
		});
	}
}

export default ContentService;
