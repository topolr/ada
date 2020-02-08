import {view, ViewConnector} from "adajs";
import Reply from "./../reply";
import ContainerService from "./../container/state";
import { template } from './template.html';
import { style } from './style.scss';

@view({
    className: "connector",
    template,
    style
})
class Connector extends ViewConnector {
    setContextDataSets(connect) {
        let userInfo = connect(ContainerService, current => {
            return current.userInfo;
        }, (current, data) => {
            current.userInfo = data;
        });
        return {userInfo, commentId: ""};
    }

    onupdate(current, data) {
        current.commentId = data.commentId;
        return current;
    }

    tags() {
        return {
            reply: Reply
        }
    }
}

export default Connector;
