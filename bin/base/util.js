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
    getProjectConfig(name) {
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
        let basePath = Path.resolve(appPath, "./../");
        if (!config.apps) {
            config.projectPath = projectPath;
            config.basePath = basePath;
            config.distPath = Path.join(basePath, config.distPath).replace(/\\/g, "/");
            config.sourcePath = Path.join(basePath, config.sourcePath).replace(/\\/g, "/");
            config.nmodulePath = Path.join(config.projectPath, "./node_modules/").replace(/\\/g, "/");
            config.indexPath = Path.join(basePath, config.indexPath, "./../").replace(/\\/g, "/");
            config.entryPath = Path.join(basePath, config.entryPath).replace(/\\/g, "/");
            config.mainEntryPath = Path.join(basePath, config.main).replace(/\\/g, "/");
            if (config.initer) {
                config.initerPath = Path.join(basePath, config.initer).replace(/\\/g, "/");
            }
            if (config.worker && config.worker.path) {
                config.workerPath = Path.join(basePath, config.worker.path).replace(/\\/g, "/");
            }
            if (config.staticPath) {
                config.staticPath = Path.join(basePath, config.staticPath).replace(/\\/g, "/");
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
        } else {
            config.apps.forEach(app => {
                app.projectPath = projectPath;
                app.basePath = basePath;
                app.distPath = Path.join(basePath, app.distPath).replace(/\\/g, "/");
                app.sourcePath = Path.join(basePath, app.sourcePath).replace(/\\/g, "/");
                app.nmodulePath = Path.join(app.projectPath, "./node_modules/").replace(/\\/g, "/");
                app.indexPath = Path.join(basePath, app.indexPath, "./../").replace(/\\/g, "/");
                app.entryPath = Path.join(basePath, app.entryPath).replace(/\\/g, "/");
                app.mainEntryPath = Path.join(basePath, app.main).replace(/\\/g, "/");
                if (app.initer) {
                    app.initerPath = Path.join(basePath, app.initer).replace(/\\/g, "/");
                }
                if (app.worker && app.worker.path) {
                    app.workerPath = Path.join(basePath, app.worker.path).replace(/\\/g, "/");
                }
                if (app.staticPath) {
                    app.staticPath = Path.join(basePath, app.staticPath).replace(/\\/g, "/");
                }
                ["projectPath", "basePath", "distPath", "sourcePath", "entryPath", "staticPath", "nmodulePath"].forEach(name => {
                    if (app[name] && !app[name].endsWith("/")) {
                        app[name] = app[name] + "/";
                    }
                });
                if (app.siteURL[app.siteURL.length - 1] !== "/") {
                    app.siteURL = app.siteURL + "/";
                }
            });
            let result = config.apps.map(app => {
                let r = {};
                Reflect.ownKeys(config).forEach(key => {
                    if (key !== "apps") {
                        r[key] = config[key];
                    }
                });
                return Object.assign(true, {}, r, app);
            });
            if (name) {
                let _result = result.find(a => a.name === name);
                if (!_result) {
                    return result[0];
                } else {
                    return _result;
                }
            }
            return result[0];
        }
    }
};

module.exports = util;