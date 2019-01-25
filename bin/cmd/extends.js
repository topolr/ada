let ora = require("ora");
let generator = require('./../base/generator');
let {VIEWMAP} = require("../config");

module.exports = {
	command: "extends",
	desc: "create a view extends another one",
	paras: ["target view", "new view"],
	fn: function (parameters) {
		let type = parameters[0], module = parameters[1];
		if (type && module) {
			let spinner = ora(`extends view ${type} to ${module}`).start();
			generator.extend(type, module).then(() => {
				spinner.succeed(`extends view ${type} to ${module} done`);
			});
		} else {
			console.log(`target view or new view can not empty`.red);
		}
	}
};