import {BondViewGroup, handler, view} from "adajs";
import ContainerService from "./state.js";
import Menu from "./../menu";
import Content from "./../content";
import Router from "./../../router";
import Comment from "./../../lib/comment";

@view({
    className: "container",
    template: "./template.html",
    style: "./style.scss",
    dataset: {
        service: ContainerService
    }
})
class Container extends BondViewGroup {
    oncreated() {
        console.log('======>xxx');
        let comment = new Comment(this.context);
        this.className.add("close");
        if (window.location.href.indexOf("code=") !== -1) {
            window.history.replaceState({}, "", window.location.href.split("?")[0]);
        }
        comment.login().then(() => {
            this.commit("setuserinfo", comment.session.userinfo);
        }).catch(e=>console.log(e));
        this.context.comment = comment;
        let _router = this.router = new Router(this.context);
        this.getCurrentState().menu.forEach(item => {
            _router.bind(item.link === "/" ? "/" : item.link, (e) => {
                this.commit("flip", item.link);
            });
        });
    }

    onready() {
        this.router.run();
    }

    tags() {
        return {
            menu: Menu,
            content: Content
        }
    }

    @handler("flip")
    flip({data}) {
        if (window.innerWidth <= 1000) {
            this.commit("close").then(() => this.router.open(data));
        } else {
            this.router.open(data);
        }
    }

    @handler("closewin")
    closeWin() {
        this.commit("close");
    }

    @handler("openwin")
    openWin() {
        this.commit("open");
    }

    @handler("login")
    login() {
        window.location.href = this.context.comment.getLoginURL();
    }
}

export default Container;
