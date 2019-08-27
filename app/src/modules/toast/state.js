import {Service} from "adajs";

class ToaseService extends Service{
	defaultData(){
		return {
			content: "this is toast"
		}
	}

	onupdate(current,info){
		current.content=info.content;
		return current;
	}
}

export default ToaseService;