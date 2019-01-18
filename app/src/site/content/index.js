import {handler, StaticViewGroup, view} from "adajs";
import ContentService from "./state.js";
import PageMenu from "./../pagemenu";
import Loading from "./../loading";
import prism from "./../../lib/prism";
import Comment from "./../comment";
import Connector from "./../connector";
import "./../../lib/prism.css";

@view({
    className: "content",
    template: "./template.html",
    style: "./style.scss",
    dataset: {
        service: ContentService
    }
})
class Content extends StaticViewGroup {
    oncreated() {
        window.document.body.scrollTop = 0;
        this.getElement().style.minHeight = window.innerHeight + "px";
    }

    onready() {
        let data = this.getCurrentState();
        this.addChild(Loading, {
            name: "loading",
            container: this.finder("page").getElement()
        });
        this.addChild(PageMenu, {
            name: "menu",
            parameter: {
                menu: data.menu,
                title: data.title,
                desc: data.desc,
                close: data.close,
                loading: !data.content
            },
            container: this.finder("head").getElement()
        });
        this.commit("getpage").then(() => {
            if (!this.isRemoved()) {
                let h2s = [];
                [...this.getElement().querySelectorAll("h2")].forEach(element => {
                    h2s.push({title: element.innerText, id: element.getAttribute("id"), subs: []});
                });
                [...this.getElement().querySelectorAll("h3")].forEach(element => {
                    let a = element;
                    while (a) {
                        if (a.tagName && a.tagName.toLowerCase() === "h2") {
                            break;
                        } else {
                            a = a.previousSibling;
                        }
                    }
                    if (a && a.tagName && a.tagName.toLowerCase() === "h2") {
                        h2s.some(info => {
                            if (info.element === a) {
                                info.subs.push({
                                    title: element.innerText,
                                    id: element.getAttribute("id")
                                });
                                return true;
                            }
                        });
                    }
                });
                if (this.getCurrentState().content) {
                    this.removeChildByName("loading");
                }
                this.commit("setmenu", h2s).then(() => {
                    if (this.context.isBrowser) {
                        prism.highlightAllUnder(this.getElement());
                    }
                    this.autoLoadModule().then(() => {
                        this.context.snapshot();
                    });
                });
            }
        });
    }

    tags() {
        return {
            pagemenu: PageMenu,
            loading: Loading
        }
    }

    oncommited() {
        let menu = this.getChildByName("menu");
        if (menu) {
            let data = this.getCurrentState();
            menu.update({
                menu: data.menu,
                title: data.title,
                desc: data.desc,
                close: data.close,
                loading: !data.content
            });
        }
        if (this.getCurrentState().commentId && !this._at) {
            this._at = true;
            this.addChild(Comment, {
                name: "comment",
                parameter: {
                    commentId: this.getCurrentState().commentId
                },
                container: this.finder("comment").getElement()
            });
        }
    }

    autoLoadModule() {
        return [...this.getElement().querySelectorAll(".ada-module")].reduce((a, element) => {
            return a.then(() => {
                let type = element.dataset.type,
                    option = element.dataset.option ? JSON.parse(element.dataset.option) : {};
                return import(type).then(module => {
                    return this.addChild(module, {
                        parameter: option,
                        container: element
                    });
                });
            });
        }, Promise.resolve());
    }

    @handler("openreply")
    openReply() {
        this.addChild(Connector, {
            name: "reply",
            parameter: {
                commentId: this.getCurrentState().commentId
            }
        });
    }

    @handler("closereply")
    closeReply() {
        this.removeChildByName("reply");
    }

    @handler("commentdone")
    commentDone() {
        this.getChildByName("comment").commit("get");
    }

    onrecover() {
        prism.highlightAllUnder(this.getElement());
    }
}

export default Content;
