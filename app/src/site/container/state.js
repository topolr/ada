import {action, Service} from "adajs";
import Logo from "./images/ada.icon";
import menu from "./../../menu.json";

class ContainerService extends Service {
    defaultData() {
        return {
            menu: menu,
            logo: Logo,
            page: "/",
            name: menu[0].name,
            desc: menu[0].desc,
            commentId: "",
            close: true,
            userInfo: {}
        };
    }

    @action("flip")
    flip(current, name) {
        current.menu.forEach(item => {
            if (item.link === name) {
                item.active = true;
                current.page = item.link;
                current.name = item.name;
                current.desc = item.desc;
                current.commentId = item.commentId;
            } else {
                item.active = false;
            }
        });
    }

    @action("close")
    close(current) {
        current.close = true;
    }

    @action("open")
    open(current) {
        current.close = false;
    }

    @action("setuserinfo")
    setUserInfo(current, info) {
        current.userInfo = info;
    }
}

export default ContainerService;
