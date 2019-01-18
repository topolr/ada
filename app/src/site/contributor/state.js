import {Service} from "adajs";

class ContributorService extends Service {
    defaultData() {
        return {
            contributors: [
                {name: "topolr", photo: "19883616"},
                {name: "hou80houzhu", photo: "3970708"},
                {name: "feinno-tang", photo: "27753028"}
            ]
        };
    }
}

export default ContributorService;
