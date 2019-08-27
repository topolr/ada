import {Dispatcher} from "adajs";

class EventDispatcher extends Dispatcher {
    constructor() {
        super();
        window.addEventListener("scroll", e => {
            window.requestAnimationFrame(() => {
                this.dispatch("scroll", e);
            });
        });
        window.document.body.addEventListener("click", e => {
            this.dispatch("click", e);
        });
    }
}

const eventDispatcher = new EventDispatcher();

export default eventDispatcher;