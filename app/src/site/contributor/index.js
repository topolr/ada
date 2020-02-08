import {view,View} from "adajs";
import ContributorService from "./state.js";
import { template } from './template.html';
import { style } from './style.scss';

@view({
    className:"contributor",
    template,
    style,
    dataset:{
    	service:ContributorService
    }
})
class Contributor extends View{
}

export default Contributor;
