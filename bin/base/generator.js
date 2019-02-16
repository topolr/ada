let Path = require("path");
let {File} = require("ada-util");
let util = require("./util");
let {VIEWMAP, TPLMAP} = require("../config");

const generator = {
    getTargetPath(targetPath, project) {
        let path = "";
        if (targetPath.substring(0, 2) === "./") {
            path = Path.resolve(util.getProjectConfig(project).sourcePath, targetPath, "./index.js");
        } else {
            path = Path.resolve(util.getProjectConfig(project).nmodulePath, targetPath, "./index.js");
            if (!new File(path).exist) {
                path = Path.resolve(util.getProjectConfig(project).sourcePath, targetPath, "./index.js");
            }
        }
        return path;
    },
    getTemplateCode(type) {
        return new File(Path.resolve(__dirname, TPLMAP[type])).transform().read();
    },
    parseTemplateCode(type, data) {
        let code = this.getTemplateCode(type);
        return code.replace(/\$\{[\s\S]+?\}/g, str => {
            let propName = str.substring(2, str.length - 1);
            return data[propName];
        });
    },
    getCodeInfo(content) {
        let r = content.match(/@view\(\{[\s\S]*?\}\)/g);
        let info = {};
        if (r) {
            let _info = r[0].substring(7, r[0].length - 2);
            _info.split(",").forEach(str => {
                if (str.indexOf("{") === -1) {
                    let a = str.split(":"), k = a[1].trim();
                    info[a[0].trim()] = k.substring(1, k.length - 1);
                }
            });
            let t = _info.match(/\{[\s\S]+\}/g);
            if (t) {
                t.forEach(str => {
                    let k = str.substring(1, str.length - 1);
                    k.split(",").forEach(_str => {
                        let e = _str.split(":");
                        if (e[0].trim() === "service") {
                            info.service = e[1].trim();
                        }
                        if (e[0].trim() === "dataset") {
                            info.dataset = e[1].trim();
                        }
                    });
                });
            }
            let m = content.match(/import[\s\S]+?(['"])[\s\S]+?\1/g);
            if (m) {
                let imports = {};
                m.forEach(str => {
                    str.split("import").forEach(_str => {
                        if (_str) {
                            let q = _str.split("from");
                            if (q.length > 1) {
                                let t = q[1].trim();
                                imports[q[0].trim()] = t.substring(1, t.length - 1);
                            }
                        }
                    })
                });
                if (info.service && imports[info.service]) {
                    info.serviceName = info.service;
                    info.service = imports[info.service];
                }
                if (info.dataset && imports[info.dataset]) {
                    info.datasetName = info.dataset;
                    info.service = imports[info.service];
                }
                if (info.service) {
                    if (Path.extname(info.service) !== ".js") {
                        info.service = info.service + ".js";
                    }
                }
            }
            return info;
        }
        return null;
    },
    createView(path, {name, exname, styleName}) {
        let className = name[0].toUpperCase() + name.substring(1);
        return [
            {
                path: Path.resolve(path, "./index.js"),
                code: this.parseTemplateCode("view", {name, exname, className, styleName})
            },
            {path: Path.resolve(path, "./state.js"), code: this.parseTemplateCode("state", {className})},
            {path: Path.resolve(path, "./style.scss"), code: this.parseTemplateCode("style", {name: styleName})},
            {path: Path.resolve(path, "./template.html"), code: this.parseTemplateCode("template")}
        ].reduce((a, info) => {
            return a.then(() => {
                return new File(info.path).write(info.code);
            });
        }, Promise.resolve());
    },
    createConnector(path, {name, exname, styleName}) {
        let className = name[0].toUpperCase() + name.substring(1);
        return [
            {
                path: Path.resolve(path, "./index.js"),
                code: this.parseTemplateCode("connector", {name, exname, className, styleName})
            },
            {path: Path.resolve(path, "./style.scss"), code: this.parseTemplateCode("style", {name: styleName})},
            {path: Path.resolve(path, "./template.html"), code: this.parseTemplateCode("template")}
        ].reduce((a, info) => {
            return a.then(() => {
                return new File(info.path).write(info.code);
            });
        }, Promise.resolve());
    },
    create(type, modulePath,project) {
        let exname = VIEWMAP[type], name = "";
        let t = modulePath.replace(/\\/g, "/").split("/");
        let styleName = modulePath.replace(/[\/]+/g, "-").toLowerCase();
        if (t.length > 0) {
            let f = t.pop();
            if (f) {
                name = f;
            } else {
                name = f.shift();
            }
        }
        let path = Path.resolve(util.getProjectConfig(project).sourcePath, modulePath);
        if (type === "connector") {
            return this.createConnector(path, {name, exname, styleName});
        } else {
            return this.createView(path, {name, exname, styleName});
        }
    },
    extend(targetPath, name,project) {
        let path = this.getTargetPath(targetPath);
        let file = new File(path), isNodeModule = path.indexOf("/node_modules/") !== -1;
        if (file.exist) {
            let content = file.transform().read();
            let codeInfo = this.getCodeInfo(content);
            if (codeInfo) {
                let _tempPath = codeInfo.template, _stylePath = codeInfo.style, _servicePath = codeInfo.service;
                if (_tempPath) {
                    _tempPath = Path.resolve(path, "./../", _tempPath);
                }
                if (_stylePath) {
                    _stylePath = Path.resolve(path, "./../", _stylePath);
                }
                if (_servicePath) {
                    _servicePath = Path.resolve(path, "./../", _servicePath);
                }
                let targetClassName = targetPath.split("/").pop();
                targetClassName = targetClassName[0].toUpperCase() + targetClassName.substring(1, targetClassName.length);
                let className = name.split("/").pop();
                className = className[0].toUpperCase() + className.substring(1, name.length);

                let basePath = util.getProjectConfig(project).sourcePath;
                let targetServicePath = "", targetClassPath = "";
                if (_servicePath) {
                    targetServicePath = Path.resolve(targetPath, _servicePath);
                    if (isNodeModule) {
                        targetServicePath = targetServicePath.substring(util.getProjectConfig(project).nmodulePath.length);
                    } else {
                        targetServicePath = Path.relative(Path.resolve(basePath, name), targetServicePath);
                    }
                }
                if (isNodeModule) {
                    targetClassPath = path.substring(util.getProjectConfig(project).nmodulePath.length);
                } else {
                    targetClassPath = Path.relative(Path.resolve(basePath, name), Path.resolve(basePath, targetPath));
                }

                let tasks = [
                    {path: Path.resolve(basePath, name, "./style.scss"), code: new File(_stylePath).transform().read()},
                    {
                        path: Path.resolve(basePath, name, "./template.html"),
                        code: new File(_tempPath).transform().read()
                    }];
                if (_servicePath) {
                    tasks.push({
                        path: Path.resolve(basePath, name, "./index.js"),
                        code: this.parseTemplateCode("extview", {
                            targetClassPath,
                            name: codeInfo.className,
                            targetClassName,
                            className
                        })
                    });
                    tasks.push({
                        path: Path.resolve(basePath, name, "./state.js"),
                        code: this.parseTemplateCode("extstate", {
                            targetServiceName: codeInfo.serviceName,
                            targetServicePath,
                            className: `${className}Service`
                        })
                    });
                } else {
                    tasks.push({
                        path: Path.resolve(basePath, name, "./index.js"),
                        code: this.parseTemplateCode("extconnector", {
                            targetClassPath,
                            name: codeInfo.className,
                            targetClassName,
                            className
                        })
                    });
                }
                return tasks.reduce((a, info) => {
                    return a.then(() => {
                        return new File(info.path).write(info.code);
                    });
                }, Promise.resolve());
            }
        }
        return Promise.resolve();
    },
    clone(targetPath, name,project) {
        let path = this.getTargetPath(targetPath);
        let file = new File(path), isNodeModule = path.indexOf("/node_modules/") !== -1;
        if (file.exist) {
            let content = file.transform().read();
            let codeInfo = this.getCodeInfo(content);
            if (codeInfo) {
                let _tempPath = codeInfo.template, _stylePath = codeInfo.style, _servicePath = codeInfo.service;
                if (_tempPath) {
                    _tempPath = Path.resolve(path, "./../", _tempPath);
                }
                if (_stylePath) {
                    _stylePath = Path.resolve(path, "./../", _stylePath);
                }
                if (_servicePath) {
                    _servicePath = Path.resolve(path, "./../", _servicePath);
                }
                let targetClassName = targetPath.split("/").pop();
                targetClassName = targetClassName[0].toUpperCase() + targetClassName.substring(1, targetClassName.length);
                let className = name.split("/").pop();
                className = name[0].toUpperCase() + name.substring(1, name.length);

                let basePath = util.getProjectConfig(project).sourcePath;

                let tasks = [
                    {
                        path: Path.resolve(basePath, name, "./template.html"),
                        code: new File(_tempPath).transform().read()
                    },
                    {
                        path: Path.resolve(basePath, name, "./style.scss"),
                        code: new File(_stylePath).transform().read()
                    }
                ];
                if (_servicePath) {
                    tasks.push({
                        path: Path.resolve(basePath, name, "./index.js"),
                        code: new File(path).transform().read()
                    });
                    tasks.push({
                        path: Path.resolve(basePath, name, "./state.js"),
                        code: new File(_servicePath).transform().read()
                    });
                } else {
                    tasks.push({
                        path: Path.resolve(basePath, name, "./index.js"),
                        code: new File(path).transform().read()
                    });
                }
                return tasks.reduce((a, info) => {
                    return a.then(() => {
                        return new File(info.path).write(info.code);
                    });
                }, Promise.resolve());
            }
        }
        return Promise.resolve();
    }
};

module.exports = generator;