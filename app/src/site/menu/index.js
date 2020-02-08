import {binder, View, view} from "adajs";
import MenuService from "./state";
import { template } from './template.html';
import { style } from './style.scss';

@view({
    className: "menu",
    template,
    style,
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
