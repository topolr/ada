import {view,${exname}} from "adajs";
import ${className}Service from "./state.js";

@view({
    className:"${styleName}",
    template:"./template.html",
    style:"./style.scss",
    dataset:{
    	service:${className}Service
    }
})
class ${className} extends ${exname}{
}

export default ${className};