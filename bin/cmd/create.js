let ora = require("ora");
let generator = require('./../base/generator');
let {VIEWMAP} = require("../config");

module.exports = {
    command: "create",
    desc: "create a view",
    paras: ["type", "module"],
    fn: function (parameters) {
        let type = parameters[0], module = parameters[1];
        if (type && module) {
            if (VIEWMAP[type]) {
                let spinner = ora(`create view ${module}`).start();
                generator.create(type, module).then(() => {
                    spinner.succeed(`create view ${module} done`);
                });
            } else {
                console.log(`can not find type of ${type}`.red);
                console.log(`type may be a value of [${Reflect.ownKeys(VIEWMAP).join(",")}]`);
                Reflect.ownKeys(VIEWMAP).forEach(key => {
                    console.log(` ${key}`.green, `->`, `${VIEWMAP[key]}`.grey);
                });
            }
        } else {
            console.log(`view path or type can not empty`.red);
        }
    }
};