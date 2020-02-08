import {view,View} from "adajs";
import LoadingService from "./state";
import { template } from './template.html';
import { style } from './style.scss';

@view({
    className:"loading",
    template,
    style,
    dataset:{
    	service:LoadingService
    }
})
class Loading extends View{
}

export default Loading;
