import {Service} from "adajs";

class LoadingService extends Service{
	defaultData(){
		return {};
	}
	
	onupdate(current,data){
		return current;
	}
}

export default LoadingService;
