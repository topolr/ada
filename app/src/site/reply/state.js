import {action, Service, util} from "adajs";
import addIcon from "./icons/add.icon";
import gitIcon from "./icons/git.icon";

class ReplyService extends Service {
	defaultData() {
		return {addIcon, gitIcon, info: {}, commentId: ""};
	}

	onupdate(current, data) {
		util.extend(current, data);
		return current;
	}

	@action("reply")
	reply(current, data) {
		return this.context.comment.comment(current.commentId, data).then(() => current);
	}
}

export default ReplyService;
