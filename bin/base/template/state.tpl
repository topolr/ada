import {Service} from "adajs";

class ${className}Service extends Service{
	defaultData(){
		return {};
	}

	onupdate(current,data){
		Object.assign(current,data);
	}
}

export default ${className}Service;