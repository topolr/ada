import {view,View} from "adajs";
import ContributorService from "./state.js";

@view({
    className:"contributor",
    template:"./template.html",
    style:"./style.scss",
    dataset:{
    	service:ContributorService
    }
})
class Contributor extends View{
}

export default Contributor;
