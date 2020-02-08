import {subscribe, view, View} from "adajs";
import LazyimageService from "./state.js";
import eventDispatcher from "../dispatcher";
import "./../style/base.scss";
import { template } from './template.html';
import { style } from './style.scss';

@view({
    className: "lazyimage",
    template,
    style,
    dataset: {
        service: LazyimageService
    }
})
class Lazyimage extends View {
    oncreated() {
        if (this.context.isBrowser) {
            eventDispatcher.observe(this);
            setTimeout(() => this.scroll());
        }
    }

    onready() {
        if (!this.context.isBrowser) {
            this.finder("image").getElement().innerHTML = `<img src="${this.getCurrentState().url}"/>`;
        }
    }

    @subscribe("scroll")
    scroll() {
        let height = document.documentElement.clientHeight;
        let top = this.getElement().getBoundingClientRect().top;
        if (top <= height) {
            this.loadImage();
        }
    }

    loadImage() {
        let state = this.getCurrentState();
        if (state.url && !state.loaded) {
            let image = document.createElement("img");
            image.addEventListener("load", () => {
                let target = this.finder("image").getElement();
                target.innerHTML = "";
                target.appendChild(image);
                eventDispatcher.unobserve(this);
                this.commit("loaded", true);
            });
            image.setAttribute("src", state.url);
        }
    }

    onrecover() {
        eventDispatcher.observe(this);
        setTimeout(() => this.scroll());
    }
}

export default Lazyimage;
