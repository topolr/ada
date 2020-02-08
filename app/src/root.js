import { root, StaticViewGroup } from "adajs";
import Container from "./site/container";
import { active } from "./style/reset.scss";
import "./icons";

@root()
class Root extends StaticViewGroup {
    onready() {
        active();
        if (this.context.isBrowser) {
            let s = this.context.document.createElement("script");
            s.setAttribute("src", "https://www.googletagmanager.com/gtag/js?id=UA-128443242-1");
            s.addEventListener("load", () => {
                this.context.window.dataLayer = window.dataLayer || [];

                function gtag() {
                    dataLayer.push(arguments);
                }

                gtag('js', new Date());
                gtag('config', 'UA-128443242-1');
            });
            this.context.document.head.appendChild(s);
        }
        this.addChild(Container);
    }
}

export default Root;