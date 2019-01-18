import {view} from "adajs";
import ${className}Service from "./state.js";
import ${targetClassName} from "${targetClassPath}";

@view({
    className:"${name}",
    template:"./template.html",
    style:"./style.scss",
    dataset:{
    	service:${className}Service
    }
})
class ${className} extends ${targetClassName}{
}

export default ${className};