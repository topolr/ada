import {view,View} from "adajs";
import SponsorsService from "./state.js";

@view({
    className:"sponsors",
    template:"./template.html",
    style:"./style.scss",
    dataset:{
    	service:SponsorsService
    }
})
class Sponsors extends View{
}

export default Sponsors;
