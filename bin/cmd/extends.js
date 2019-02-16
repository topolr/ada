let ora = require("ora");
let generator = require('./../base/generator');
let {VIEWMAP} = require("../config");

module.exports = {
    command: "extends",
    desc: "create a view extends another one",
    paras: ["target view", "new view", "[project]"],
    fn: function (parameters) {
        let type = parameters[0], module = parameters[1], project = parameters[2];
        if (type && module) {
            let spinner = ora(`extends view ${type} to ${module}`).start();
            generator.extend(type, module, project).then(() => {
                spinner.succeed(`extends view ${type} to ${module} done`);
            });
        } else {
            console.log(`target view or new view can not empty`.red);
        }
    }
};