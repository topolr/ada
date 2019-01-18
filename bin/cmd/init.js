let download = require("download-git-repo");
let colors = require("colors");
let {File} = require("ada-util");
let Path = require("path");
let ora = require('ora');

module.exports = {
	command: "init",
	desc: "init project",
	paras: ["name", "type"],
	fn: function (parameters) {
		let name = parameters[0], type = parameters[1], path = process.cwd();
		let spinner = ora('Download template project').start();
		let map = {
			web: "ada-template-web",
			server: "ada-template-server",
			component: "ada-template-component"
		};
		if (!map[type]) {
			type = "ada-template-web";
		} else {
			type = map[type];
		}
		download(`topolr/${type}`, path, function (err) {
			if (err) {
				spinner.fail(`download error`);
			} else {
				spinner.stop();
				if (name) {
					let package = new File(Path.resolve(path, "./package.json"));
					if (package.exist) {
						let info = JSON.parse(package.readSync());
						info.name = name;
						package.write(JSON.stringify(info, null, 4)).then(() => {
							console.log(` - project is ready!`.yellow);
						});
					}
				} else {
					console.log(`project is ready!`.yellow);
				}
			}
		});
	}
};