import {view,View} from "adajs";
import LoadingService from "./state.js";

@view({
    className:"loading",
    template:"./template.html",
    style:"./style.scss",
    dataset:{
    	service:LoadingService
    }
})
class Loading extends View{
}

export default Loading;
