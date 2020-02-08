let { getMappedPath, isFunction, setProp } = require("../../util/helper");
let { MODULEPATH } = require("../../util/const");

class EmptyPersistence {
    constructor(context) {
        this.context = context;
    }

    getAll() {
        return Promise.resolve({});
    }

    saveAll(data) {
        return Promise.resolve();
    }

    clean() {
        return Promise.resolve();
    }
}

class StoragePersistence {
    constructor(context) {
        this.context = context;
    }

    getAll() {
        let r = {};
        try {
            r = this.context.window.localStorage.getItem("ada-local-source");
        } catch (e) {
        }
        return Promise.resolve(r);
    }

    saveAll(data) {
        try {
            this.context.window.localStorage.setItem("ada-local-source", JSON.stringify(data));
        } catch (e) {
        }
        return Promise.resolve();
    }

    clean() {
        try {
            this.context.window.localStorage.removeItem("ada-local-source");
        } catch (e) {
        }
        return Promise.resolve();
    }
}

class DatabasePersistence {
    constructor(context) {
        this.context = context;
        this.db = null;
        this.info = {
            name: "ada",
            version: 1,
            store: "ada-source",
            key: "name",
            value: "source"
        }
    }

    ready() {
        if (!this.db) {
            if (!this.context.window.indexedDB) {
                this.context.window.indexedDB = this.context.window.mozIndexedDB || this.context.window.webkitIndexedDB;
            }
            return new Promise(resolve => {
                let request = this.context.window.indexedDB.open(this.info.name, this.info.version);
                request.onupgradeneeded = () => {
                    let db = request.result;
                    if (db.objectStoreNames.contains(this.info.store)) {
                        db.deleteObjectStore(this.info.store);
                    }
                    let store = db.createObjectStore(this.info.store, { keyPath: this.info.key });
                    store.put({ name: this.info.value, data: {} });
                };
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve();
                };
                request.onerror = () => {
                    resolve();
                };
            });
        } else {
            return Promise.resolve();
        }
    }

    getAll() {
        return new Promise(resolve => {
            this.ready().then(() => {
                let transaction = this.db.transaction([this.info.store], "readwrite");
                transaction.onerror = function (event) {
                    resolve({});
                };
                let request = transaction.objectStore(this.info.store).get(this.info.value);
                request.onerror = () => {
                    resolve({});
                };
                request.onsuccess = () => {
                    resolve(request.result ? request.result.data : {});
                };
            });
        });
    }

    saveAll(data) {
        return new Promise(resolve => {
            this.ready().then(() => {
                let transaction = this.db.transaction([this.info.store], "readwrite");
                transaction.oncomplete = () => {
                    resolve();
                };
                transaction.onerror = () => {
                    resolve();
                };
                transaction.objectStore(this.info.store).put({
                    name: this.info.value,
                    data: data
                });
            });
        });
    }

    clean() {
        return new Promise(resolve => {
            this.ready().then(() => {
                let transaction = this.db.transaction([this.info.store], "readwrite");
                transaction.oncomplete = () => {
                    resolve();
                };
                transaction.onerror = () => {
                    resolve();
                };
                transaction.objectStore(this.info.store).delete(this.info.value);
            });
        });
    }
}

class ModuleLoader {
    constructor(context, loader) {
        this.installed = {};
        this.moduleFnsLoaded = {};
        this._loader = loader;
        this._context = context;
    }

    getExcutor(path, code) {
        let suffix = path.split("/").pop().split(".").pop();
        let source = code;
        if (suffix === "js") {
            source = code;
        } else if (suffix === "css" || suffix === "scss" || suffix === "less") {
            source = `module.exports={
    style:${JSON.stringify(code)},
    active:function(){var styles={_linkElement:null,active:function(){var et=document.getElementById("${path}");if(!et){var _a = document.createElement("style");_a.setAttribute("media", "screen");_a.setAttribute("type", "text/css");_a.setAttribute("id","${path.replace(/\//g, "-")}");_a.appendChild(document.createTextNode(${JSON.stringify(code)}));styles._linkElement=_a;document.getElementsByTagName("head")[0].appendChild(_a);}else{et.innerText="";et.appendChild(document.createTextNode(${JSON.stringify(code)}));}}};if(/complete|loaded|interactive/.test(window.document.readyState)){styles.active();}else{window.document.addEventListener('DOMContentLoaded', function(){styles.active();},false);}},
    isReady:function(){return styles._linkElement!==null;},
    getElement:function(){return styles._linkElement;},
    remove:function(){if(styles._linkElement){styles._linkElement.parentNode.removeChild(styles._linkElement);}}};`;
        } else if (suffix === "json") {
            source = `module.exports=${code}`;
        } else if (suffix === "html") {
            source = `module.exports={template:${JSON.stringify(code)}}`;
        } else if (suffix === 'text') {
            source = `module.exports=${JSON.stringify(code)}`;
        } else {
            source = code;
        }
        let info = { path, code: source };
        return new Function("module", "exports", "require", "imports", "babelHelpers", "window", "document", info.code);
    }

    getModuleDependenceInfo(path, code) {
        let paths = [];
        code = code.replace(/require\(.*?\)/g, (one) => {
            let _path = one.substring(8, one.length - 1).replace(/['|"|`]/g, "").trim();
            paths.push(_path);
            return `require("${_path}")`;
        });
        return { code, paths };
    }

    getModuleDependenceMap(path) {
        return this._loader.get(path).then(source => {
            let { paths, code: moduleCode } = this.getModuleDependenceInfo(path, source);
            let result = { [path]: moduleCode };
            let works = [];
            paths.map(path => {
                if (!this.installed[path]) {
                    works.push(this.getModuleDependenceMap(path));
                }
            });
            return Promise.all(works).then(maps => {
                Object.assign(result, ...maps);
                return result;
            });
        });
    }

    excute(path) {
        if (this.installed[path]) {
            return this.installed[path].exports;
        }
        let module = this.installed[path] = {
            path: path,
            exports: {}
        };
        this.moduleFnsLoaded[path].call(module.exports, module, module.exports, (path) => this.excute(path), (path) => {
            return this.load(path).then(_result => _result.__esModule ? _result.default : _result).then(result => {
                if (isFunction(result)) {
                    setProp(result, MODULEPATH, path);
                }
                return result;
            });
        }, this._loader._context.window.babelHelpers || {}, this._loader._context.window, this._loader._context.document);
        return module.exports;
    }

    load(path) {
        let current = this.installed[path];
        if (current) {
            return Promise.resolve(current.exports);
        } else {
            return this.getModuleDependenceMap(path).then(moduleMap => {
                return Reflect.ownKeys(moduleMap).reduce((a, i) => {
                    return a.then(() => {
                        let info = {
                            name: i,
                            code: moduleMap[i]
                        };
                        return this._context._invokeHook('sourceexcute', info).then(() => info.code);
                    }).then((code) => {
                        this.moduleFnsLoaded[i] = this.getExcutor(i, code);
                    });
                }, Promise.resolve()).then(() => {
                    return this.excute(path);
                });
            });
        }
    }

    excuteScript(path) {
        return this.load(path);
    }

    scan(fn) {
        if (fn) {
            for (let i in this.installed) {
                let a = this.installed[i];
                let r = fn(i, a.exports);
                if (r === false) {
                    break;
                }
            }
        }
    }

    scanClass(fn) {
        if (fn) {
            for (let i in this.installed) {
                let a = this.installed[i];
                if (!a.exports.__esModule && isFunction(a.exports)) {
                    if (fn(i, a.exports) === false) {
                        break;
                    }
                }
                for (let t in a.exports) {
                    let e = a.exports[t];
                    if (isFunction(e)) {
                        if (fn(i, e) === false) {
                            break;
                        }
                    }
                }
            }
        }
    }

    filter(fn) {
        let result = [];
        if (fn) {
            for (let i in this.installed) {
                let a = this.installed[i];
                let r = fn(i, a.exports.__esModule ? a.exports.default : a.exports);
                if (r !== undefined) {
                    result.push(r);
                }
            }
        }
        return result;
    }

    get(path) {
        let a = this.installed[path];
        if (a) {
            return a.exports.__esModule ? a.exports.default : a.exports;
        }
        return null;
    }

    has(path) {
        return this.installed[path] !== undefined;
    }

    set(path, _exports) {
        this.installed[path] = { exports: _exports };
        return this;
    }
}

class SourceQueue {
    constructor(loader) {
        this.tasks = [];
        this.isRunning = false;
        this._loader = loader;
    }

    add(path, fn, error) {
        this.tasks.push({ path, fn, error });
        this.run();
    }

    run() {
        if (!this.isRunning) {
            let task = this.tasks.shift();
            if (task) {
                this.isRunning = true;
                this._loader.getSource(task.path).then(info => {
                    this.isRunning = false;
                    task.fn(info);
                    this.run();
                }, (err) => {
                    this.isRunning = false;
                    task.error(err);
                    this.run();
                });
            }
        }
    }
}

class ActiveSource {
    constructor(loader) {
        this.cache = [];
        this._loader = loader;
    }

    excute(path) {
        if (!this.cache[path]) {
            return this._loader.get(path).then(code => {
                this.cache[path] = code;
                return code;
            });
        } else {
            return Promise.resolve(this.cache[path]);
        }
    }

    has(path) {
        return this.cache[path] !== undefined;
    }
}

class Loader {
    constructor(context) {
        this._moduleLoader = new ModuleLoader(context, this);
        this._sourceQueue = new SourceQueue(this);
        this._activeSource = new ActiveSource(this);
        this._source = {};
        this._context = context;
        this._isinit = false;
        let target = null;
        if (context.config.develop || !context.isBrowser) {
            target = new EmptyPersistence(context);
        } else {
            if (context.window.indexedDB || context.window.mozIndexedDB || context.window.webkitIndexedDB) {
                target = new DatabasePersistence(context);
            } else if (context.window.localStorage) {
                target = new StoragePersistence(context);
            } else {
                target = new EmptyPersistence(context);
            }
        }
        this.persistence = target;
    }

    get source() {
        return this._source;
    }

    get moduleLoader() {
        return this._moduleLoader;
    }

    get sourceQueue() {
        return this._sourceQueue;
    }

    get activeSource() {
        return this._activeSource;
    }

    get context() {
        return this._context;
    }

    ready() {
        if (!this._isinit) {
            return this.persistence.getAll().then(source => {
                this._isinit = true;
                this._source = Object.assign({}, source, this._source);//？？？？？
                return this.persistence.saveAll(this.source);
            });
        } else {
            return Promise.resolve();
        }
    }

    get(path) {
        return new Promise((resolve, reject) => {
            this.sourceQueue.add(path, (info) => {
                resolve(info);
            }, (err) => {
                reject(err);
            });
        });
    }

    getRealPath(path, ispackage = false) {
        let r = path, hash = "", option = this.context.config;
        if (ispackage) {
            hash = option.sourceMap[path.split(".").shift()];
        } else {
            hash = option.sourceMap[getMappedPath(path)];
        }
        if (!option.develop) {
            let a = path.split("/");
            let b = a.pop();
            let c = b.split(".");
            a.push(`${hash}.${c[1]}`);
            r = a.join("/");
        } else {
            r = `${path}?h=${new Date().getTime()}`;
        }
        return `${option.basePath[option.basePath.length - 1] === "/" ? option.basePath : option.basePath + "/"}${r}`;
    }

    getSourceCode(path) {
        return this.context.request.origin({ url: path, method: 'get' }).promise.then(info => info.data);
    }

    getSourceByHash(filepath, path, rhash) {
        let r = 0, option = this.context.config;
        let file = Reflect.ownKeys(option.sourceMap.packages).filter(packetname => {
            return option.sourceMap.packages[packetname].indexOf(rhash) !== -1;
        })[0];
        if (file) {
            option.sourceMap.packages[file].split("|").forEach(key => {
                let name = Reflect.ownKeys(option.sourceMap).filter(name => option.sourceMap[name] === key)[0];
                let hash = option.sourceMap[name];
                if (!this.source[hash]) {
                    r += 1;
                }
            });
            if (r > 1) {
                return this.getSourceCode(`${this.getRealPath(file + ".js", true)}`).then(code => {
                    let info = JSON.parse(code.substring(code.indexOf(",") + 1, code.length - 1));
                    Reflect.ownKeys(info).forEach(name => {
                        let { hash, code } = info[name];
                        this.source[hash] = code;
                    });
                    return this.persistence.saveAll(this.source).then(() => {
                        return this.source[rhash];
                    });
                });
            } else {
                return this.getSourceCode(`${this.getRealPath(filepath)}`).then(code => {
                    this.source[rhash] = code;
                    return this.persistence.saveAll(this.source).then(() => code);
                });
            }
        } else {
            if (rhash) {
                return this.getSourceCode(`${this.getRealPath(filepath)}`).then(code => {
                    this.source[rhash] = code;
                    return this.persistence.saveAll(this.source).then(() => code);
                });
            } else {
                return this.getSourceCode(`${this.getRealPath(filepath)}`);
            }
        }
    }

    getSource(filepath) {
        return this.ready().then(() => {
            let path = getMappedPath(filepath), option = this.context.config;
            let rhash = option.sourceMap[path];
            if (this.source[rhash]) {
                return this.source[rhash];
            } else {
                if (option.sourceMap) {
                    return this.getSourceByHash(filepath, path, option.sourceMap[path]);
                } else {
                    return this.getSourceCode(`${this.getRealPath(filepath)}`);
                }
            }
        });
    }

    loadModule(path) {
        return this.moduleLoader.excuteScript(path).then(_exports => {
            if (_exports.__esModule === true) {
                return _exports.default;
            }
        });
    }

    loadSource(path) {
        return this.activeSource.excute(path);
    }

    decompress(source = {}) {
        if (!this._source) {
            this._source = {};
        }
        Reflect.ownKeys(source).forEach(name => {
            let { hash, code } = source[name];
            this._source[hash] = code;
        });
    }
}

module.exports = Loader;