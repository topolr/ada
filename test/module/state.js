import {action, Service} from "./../../index";

class Teststate extends Service {
    defaultData() {
        return {
            hello: "hello world",
            status: 0,
            message: ""
        };
    }

    @action("change")
    change(current) {
        return this.request.get("http://api.map.baidu.com/telematics/v3/weather?location=%E5%98%89%E5%85%B4&output=json&ak=5slgyqGDENN7Sy7pw29IUvrZ").then(info => {
            Object.assign(current, JSON.parse(info));
            return current;
        }).catch(e => console.log(e));
    }
}

export default Teststate;