import {view,View} from "adajs";
import SponsorsService from "./state.js";
import { template } from './template.html';
import { style } from './style.scss';

@view({
    className:"sponsors",
    template,
    style,
    dataset:{
    	service:SponsorsService
    }
})
class Sponsors extends View{
}

export default Sponsors;
