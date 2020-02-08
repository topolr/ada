import { root, StaticViewGroup } from "adajs";
import Loading from './modules/loading';

@root()
class Root extends StaticViewGroup {
    onready() {
        this.addChild(Loading);
    }

    onrecover(){
        this.addChild(Loading);
    }
}

export default Root;