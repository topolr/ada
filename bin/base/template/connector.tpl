import {view,${exname}} from "adajs";

@view({
    className:"${name}",
    template:"./template.html",
    style:"./style.scss"
})
class ${className} extends ${exname}{
	setContextDataSets(connect){
		return {};
	}

	onupdate(current,data){
		Object.assign(current,data);
	}
}

export default ${className};