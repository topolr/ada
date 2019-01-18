import {action, Service} from "adajs";
import addIcon from "./icons/add.icon";

class CommentService extends Service {
	defaultData() {
		return {
			commentId: "",
			infos: [],
			addIcon,
			loading: true
		};
	}

	onupdate(current, data) {
		current.commentId = data.commentId;
		return current;
	}

	@action("get")
	get(current) {
		return this.context.comment.getIssueCommentsById(current.commentId).then(info => {
			current.infos = info.map(info => {
				return {
					id: info.id,
					content: info.body,
					time: info.updated_at,
					userIcon: info.user.avatar_url,
					userPage: `https://github.com/${info.user.login}`,
					userId: info.user.id,
					userName: info.user.login
				}
			});
			return current.infos.reduce((a, info) => {
				return a.then(() => {
					return this.context.comment.getMarkdownContent(info.content).then(a => {
						info.content = a;
					});
				});
			}, Promise.resolve()).then(() => {
				current.loading = false;
				return current;
			});
		});
	}
}

export default CommentService;