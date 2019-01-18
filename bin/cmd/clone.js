let ora = require("ora");
let generator = require('./../base/generator');
let {VIEWMAP} = require("../config");

module.exports = {
    command: "clone",
    desc: "clone a view to another",
    paras: ["target view", "new view"],
    fn: function (parameters) {
        let type = parameters[0], module = parameters[1];
        if (type && module) {
            if (VIEWMAP[type]) {
                let spinner = ora(`clone view ${type} to ${module}`).start();
                generator.clone(type, module).then(() => {
                    spinner.succeed(`clone view ${type} to ${module} done`);
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