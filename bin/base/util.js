let Path = require("path");
let {SyncFile} = require("ada-util");
const util = {
	randomid(len = 7) {
		if (len <= 2) {
			len = 7;
		}
		return Math.random().toString(36).slice(2, len + 2);
	},
	encodeHTML(str) {
		if (ISHTMLREG.test(str)) {
			let temp = document.createElement("div");
			(temp.textContent != undefined) ? (temp.textContent = str) : (temp.innerText = str);
			return temp.innerHTML;
		} else {
			return str;
		}
	},
	getProjectConfig() {
		let projectPath = process.cwd(), appPath = "";
		let packagePath = Path.resolve(projectPath, "./package.json");
		let packageInfo = require(packagePath);
		let adaInfo = packageInfo.ada;
		appPath = adaInfo.develop ? adaInfo.develop : "./app/app.js";
		appPath = Path.resolve(packagePath, "./../", appPath);
		if (!new SyncFile(appPath).exist) {
			appPath = Path.resolve(projectPath, "./app.js");
		}
		let config = require(appPath);
		config.projectPath = projectPath;
		config.basePath = Path.resolve(appPath, "./../");
		config.distPath = Path.join(config.basePath, config.distPath).replace(/\\/g, "/");
		config.sourcePath = Path.join(config.basePath, config.sourcePath).replace(/\\/g, "/");
		config.nmodulePath = Path.join(config.projectPath, "./node_modules/").replace(/\\/g, "/");
		config.indexPath = Path.join(config.basePath, config.indexPath, "./../").replace(/\\/g, "/");
		config.entryPath = Path.join(config.basePath, config.entryPath).replace(/\\/g, "/");
		config.mainEntryPath = Path.join(config.basePath, config.main).replace(/\\/g, "/");
		if (config.initer) {
			config.initerPath = Path.join(config.basePath, config.initer).replace(/\\/g, "/");
		}
		if (config.worker && config.worker.path) {
			config.workerPath = Path.join(config.basePath, config.worker.path).replace(/\\/g, "/");
		}
		if (config.staticPath) {
			config.staticPath = Path.join(config.basePath, config.staticPath).replace(/\\/g, "/");
		}
		["projectPath", "basePath", "distPath", "sourcePath", "entryPath", "staticPath", "nmodulePath"].forEach(name => {
			if (config[name] && !config[name].endsWith("/")) {
				config[name] = config[name] + "/";
			}
		});
		if (config.siteURL[config.siteURL.length - 1] !== "/") {
			config.siteURL = config.siteURL + "/";
		}
		return config;
	}
};

module.exports = util;