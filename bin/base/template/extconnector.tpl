import {view} from "adajs";
import ${targetClassName} from "${targetClassPath}";

@view({
    className:"${name}",
    template:"./template.html",
    style:"./style.scss"
})
class ${className} extends ${targetClassName}{
    setContextDataSets(connect){
		return {};
	}

	onupdate(current,data){
		Object.assign(current,data);
	}
}

export default ${className};