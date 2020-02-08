import { binder, view, ViewGroup } from "adajs";
import CommentService from "./state.js";
import { template } from './template.html';
import { style } from './style.scss';

@view({
    className: "comment",
    template,
    style,
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

    onrecover() {
        this.commit("get");
    }
}

export default Comment;
