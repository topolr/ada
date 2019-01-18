import ${targetServiceName} from "${targetServicePath}";

class ${className}Service extends ${targetServiceName}{
	defaultData(){
		return util.extend(super(),{});
	}

	onupdate(current,data){
	    Object.assign(current,data);
	}
}

export default ${className}Service;