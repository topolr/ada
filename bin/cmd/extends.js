let ora = require("ora");
let generator = require('./../base/generator');
let {VIEWMAP} = require("../config");

module.exports = {
    command: "extends",
    desc: "create a view extends another",
    paras: ["target view", "new view"],
    fn: function (parameters) {
        let type = parameters[0], module = parameters[1];
        if (type && module) {
            if (VIEWMAP[type]) {
                let spinner = ora(`extends view ${type} to ${module}`).start();
                generator.extend(type, module).then(() => {
                    spinner.succeed(`extends view ${type} to ${module} done`);
                });
            } else {
                console.log(`can not find type of ${type}`.red);
                console.log(`type may be a value of [${Reflect.ownKeys(VIEWMAP).join(",")}]`);
                Reflect.ownKeys(VIEWMAP).forEach(key => {
                    console.log(` ${key}`.green, `->`, `${VIEWMAP[key]}`.grey);
                });
            }
        } else {
            console.log(`target view or new view can not empty`.red);
        }
    }
};