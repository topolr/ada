const { VIEWTAG, DATASET, DATASETDATA, DDMTAG, CHILDRENTAG } = require("./../src/util/const");

class Manager {
    constructor(contextClass, config = {}) {
        this._contextClass = contextClass;
        this._contextConfig = config;
        this._context = new contextClass(config);
        this._contextMap = [];
        this._root = null;
        this._develop = false;
        this._basePath = null;
        this._commonModules = {};
        this._setContextFn = null;
        this._onsnapshoot = null;
        this._snapshootalways = null;
        this._next = Promise.resolve();
    }

    get context() {
        return this._context;
    }

    _cleanView(target) {
        if (target.querySelectorAll && !target.parentNode) {
            return [target, ...target.querySelectorAll("[data-module]")].reverse().reduce((a, module) => {
                return a.then(() => {
                    if (module[VIEWTAG] && module[VIEWTAG]._remove && !module._sorted) {
                        return module[VIEWTAG]._remove();
                    }
                    return Promise.resolve();
                });
            }, Promise.resolve());
        } else {
            return Promise.resolve();
        }
    }

    _installModules() {
        this._contextMap.forEach(a => {
            if (this._setContextFn) {
                this._setContextFn(a);
            }
            Reflect.ownKeys(this._commonModules).forEach(name => {
                a.loader.moduleLoader.set(name, this._commonModules[name]);
            });
        });
    }

    _setView(info, parent) {
        let { id, module, name, useProps, app } = info;
        let context = this.getContext(app);
        if (context) {
            return Promise.resolve().then(() => {
                return context.ready();
            }).then(() => {
                return context.loader.loadModule(module).then(view => {
                    return context.getViewInstance({
                        viewClass: view,
                        parent,
                        dom: this._context.document.querySelectorAll("[data-module-id='" + id + "']")[0],
                        name: name,
                        tag: parent ? 'view' : "root",
                        useProps,
                        context,
                        id
                    }).then(p => {
                        let ps = Promise.resolve();
                        if (p[DATASET]) {
                            p[DATASET][DATASETDATA] = info.state;
                        }
                        if (p[DDMTAG]) {
                            p[DDMTAG].render(info.state);
                        }
                        if (p.oncreated) {
                            let r = p.oncreated();
                            if (r && r.then) {
                                ps = ps.then(() => r);
                            }
                        }
                        if (p.onrecover) {
                            let r = p.onrecover();
                            if (r && r.then) {
                                ps = ps.then(() => r);
                            }
                        }
                        if (info.children) {
                            ps = ps.then(() => {
                                return info.children.reduce((a, childInfo) => {
                                    return a.then(() => {
                                        return this._setView(childInfo, p).then(v => {
                                            p[CHILDRENTAG].push(v);
                                        });
                                    });
                                }, Promise.resolve()).then(() => p);
                            });
                        }
                        return ps.then(() => p);
                    });
                });
            });
        } else {
            return Promise.resolve();
        }
    }

    _boot() {
        let MutationObserver = this._context.window.MutationObserver || this._context.window.WebKitMutationObserver || this._context.window.MozMutationObserver;
        if (MutationObserver) {
            new MutationObserver(mutations => {
                mutations.forEach(mutation => [...mutation.removedNodes].reduce((a, target) => {
                    return a.then(() => this._cleanView(target));
                }, Promise.resolve()));
            }).observe(this._context.document, { childList: true, subtree: true });
        } else {
            this._context.document.addEventListener("DOMNodeRemoved", (e) => {
                this._cleanView(e.target);
            });
        }
        if (!this.context.document.getElementById('ada-module-snapshot')) {
            let target = this.getContext(this._root);
            if (target) {
                return target.boot({ container: this._context.document.body });
            }
        }
        return Promise.resolve();
    }

    getContext(name) {
        if (!name) {
            name = this._root;
        }
        return this._contextMap.find(a => a.config.name === name);
    }

    setContext(fn) {
        this._setContextFn = fn;
    }

    boot({ basePath, develop, map, root }) {
        this._next = this._next.then(() => {
            this._ready = true;
            this._root = root;
            this._basePath = basePath;
            this._develop = develop;
            this._contextMap = map.map(a => {
                return new this._contextClass(Object.assign(this._contextConfig, { siteURL: a.url, name: a.name }));
            });
            this._contextMap.forEach(a => a._manager = this);
            this._installModules();
            return new Promise((resolve) => {
                if (/complete|loaded|interactive/.test(this._context.document.readyState)) {
                    this._boot().then(root => resolve(root));
                } else {
                    this._context.document.addEventListener('DOMContentLoaded', () => {
                        this._boot().then(root => resolve(root));
                    }, false);
                }
            });
        });
        return this._next;
    }

    unpack(appName, info) {
        let context = this.getContext(appName);
        if (context) {
            context.loader.decompress(info);
        }
    }

    installModule(name, module) {
        this._commonModules[name] = module;
        this._installModules();
    }

    recover(info) {
        this._next = this._next.then(() => {
            return new Promise(resolve => {
                if (/complete|loaded|interactive/.test(this._context.document.readyState)) {
                    this._setView(info, null).then(resolve);
                } else {
                    this._context.document.addEventListener('DOMContentLoaded', () => {
                        this._setView(info, null).then(resolve);
                    });
                }
            });
        });
        return this._next;
    }

    startLogger() {
        this._contextMap.forEach(a => {
            a.logger.on = true;
        });
    }

    stopLogger() {
        this._contextMap.forEach(a => {
            a.logger.on = false;
        });
    }

    snapshot() {
        this._snapshootalways && this._snapshootalways();
        this._onsnapshoot && this._onsnapshoot();
    }
}

module.exports = Manager;