import {Service} from "adajs";

class SponsorsService extends Service{
	defaultData(){
		return {
            sponsors: [
                {name: "北京天拓数信科技", photo: "bjttsx",url:"http://www.bjttsx.com"}
            ]
		};
	}
}

export default SponsorsService;
