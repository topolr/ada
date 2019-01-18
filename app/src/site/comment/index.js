import {binder, view, ViewGroup} from "adajs";
import CommentService from "./state.js";

@view({
    className: "comment",
    template: "./template.html",
    style: "./style.scss",
    dataset: {
        service: CommentService
    }
})
class Comment extends ViewGroup {
    onready() {
        if (this.context.isBrowser) {
            this.commit("get");
        }
    }

    onbeforecommit(type) {
        if (type === "get") {
            this.finder("loader").getElement().style.display = "block";
        }
    }

    oncommited(type) {
        if (type === "get") {
            this.finder("loader").getElement().style.display = "none";
        }
    }

    @binder("open")
    open() {
        this.dispatchEvent("openreply");
    }

    onrecover(){
		this.commit("get");
    }
}

export default Comment;
