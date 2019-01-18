import {binder, View, view} from "adajs";
import MenuService from "./state.js";

@view({
    className: "menu",
    template: "./template.html",
    style: "./style.scss",
    dataset: {
        service: MenuService
    }
})
class Menu extends View {
    @binder("flip")
    flip({item, e}) {
        this.dispatchEvent("flip", item.link === "/" ? "/" : item.link);
        e.stopPropagation();
        e.preventDefault();
    }
}

export default Menu;
