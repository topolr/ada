import {binder, BondViewGroup, view} from "adajs";
import ReplyService from "./state.js";
import Toast from "./../../modules/toast";
import Loading from "./../../modules/loading";

@view({
    className: "reply",
    template: "./template.html",
    style: "./style.scss",
    dataset: {
        service: ReplyService
    }
})
class Reply extends BondViewGroup {
    oncreated() {
        setTimeout(() => {
            this.className.add("open");
        });
    }

    @binder("close")
    close() {
        this.closePannel();
    }

    @binder("login")
    login() {
        this.dispatchEvent("login");
    }

    @binder("reply")
    reply() {
        let text = this.finder("input").getElement().innerHTML;
        if (text.trim().length > 0) {
            this.addChild(Loading).then(loading => {
                this.commit("reply", text).then(() => {
                    loading.showSuccess();
                    loading.close();
                    setTimeout(() => {
                        this.closePannel();
                        this.dispatchEvent("commentdone")
                    }, 2000)
                });
            });
        } else {
            this.addChild(Toast, {
                parameter: {
                    content: "reply content can not empty"
                }
            });
        }
    }

    closePannel() {
        this.className.remove("open");
        setTimeout(() => {
            this.dispatchEvent("closereply");
        }, 500);
    }
}

export default Reply;
