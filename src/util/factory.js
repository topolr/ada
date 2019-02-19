let Metadata = require("./../lib/metadata");
let {ROOTELEMENTNAME, VIEWTAG, DATASET, DATASETDATA, DDMTAG, CHILDRENTAG} = require("./const");
let {parseTemplate, parseStyle, excuteStyle, setProp} = require("./helper");
let env = require("./../env");

let factory = {
    cleanView(target) {
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
    },
    getViewInstance({viewClass, parent, dom, name = "", tag = "view", useProps = [], context = null, id}) {
        let info = Metadata.getMetadataExtends(tag, viewClass.prototype);
        if (!info.scope) {
            info.scope = "local";
        }
        let ps = Promise.resolve();
        if (info.template) {
            ps = ps.then(() => context.loader.loadSource(info.template).then(code => {
                info.template = info.scope === "local" ? parseTemplate(code, info.className) : code;
            }));
        }
        if (info.style) {
            ps = ps.then(() => context.loader.loadSource(info.style).then(code => {
                excuteStyle(info.scope === "local" ? parseStyle(code, info.className) : code, `${info.style.replace(/\//g, "-")}:${info.className}`, context);
            }));
        }
        return ps.then(() => {
            if (info.className) {
                dom.classList.add(info.className);
            }
            let _view = new viewClass({
                parent,
                info,
                name,
                dom,
                useProps,
                context,
                id
            });
            setProp(dom, VIEWTAG, _view);
            return _view;
        });
    },
    getRootView(viewClass, parameter = {}, context = null) {
        let boot = () => {
            if (!context.document.getElementById("ada-root")) {
                // context.isBrowser && context.document.querySelectorAll("[data-module]").forEach(e => e.parentNode.removeChild(e));
                let rootElement = context.document.createElement("div");
                rootElement.setAttribute("id", ROOTELEMENTNAME);
                rootElement.setAttribute("class", ROOTELEMENTNAME);
                rootElement.setAttribute("data-module", `ada-root`);
                context.document.body.appendChild(rootElement);
                let root = rootElement[VIEWTAG];
                if (!root) {
                    return factory.getViewInstance({
                        viewClass,
                        parent: null,
                        dom: rootElement,
                        tag: "root",
                        name: "root",
                        useProps: [],
                        context
                    }).then(view => {
                        view.oncreated();
                        return view.update(parameter).then(() => {
                            view.onready();
                            return view;
                        });
                    });
                }
                return Promise.resolve(root);
            } else {
                return Promise.resolve(null);
            }
        };
        return new Promise((resolve, reject) => {
            if (/complete|loaded|interactive/.test(context.document.readyState)) {
                boot().then(root => resolve(root));
            } else {
                context.document.addEventListener('DOMContentLoaded', () => boot().then(root => resolve(root)), false);
            }
        });
    },
    init(context, initer) {
        context._steps.push("init");
        if (initer) {
            context._bootFlow = context._bootFlow.then(() => initer.call({context})).then(info => {
                return context._invokeHook("initdone", info);
            });
        }
    },
    boot({root = "", basePath = "", parameter = {}, map = {}, develop = true, context, name = ""} = {}) {
        context._steps.push("boot");
        context.config = {root, basePath, develop, parameter, sourceMap: map, name};
        env.develop = develop;
        if (root.indexOf("./") === 0) {
            root = root.substring(2);
        }
        if (root.indexOf("/") === 0) {
            root = root.substring(1);
        }
        context._bootFlow = context._bootFlow.then(() => {
            return context.loader.loadModule(root).then(() => {
                let rootClass = null;
                context.loader.moduleLoader.scanClass((path, module) => {
                    if (Metadata.getMetadata("root", module.prototype)) {
                        rootClass = module;
                        return false;
                    }
                });
                if (rootClass) {
                    return factory.getRootView(rootClass, parameter, context).then(view => {
                        let MutationObserver = context.window.MutationObserver || context.window.WebKitMutationObserver || context.window.MozMutationObserver;
                        if (MutationObserver) {
                            new MutationObserver(mutations => {
                                mutations.forEach(mutation => [...mutation.removedNodes].reduce((a, target) => {
                                    return a.then(() => factory.cleanView(target));
                                }, Promise.resolve()));
                            }).observe(context.document, {childList: true, subtree: true});
                        } else {
                            context.document.addEventListener("DOMNodeRemoved", (e) => factory.cleanView(e.target));
                        }
                        return view;
                    });
                } else {
                    console.error("root class can not find");
                    return Promise.reject();
                }
            });
        }).then(() => {
            return context._invokeHook("bootdone");
        });
    },
    recover(context, info) {
        let setView = (info, parent) => {
            let {id, module, name, useProps} = info;
            return context.loader.loadModule(module).then(view => {
                return this.getViewInstance({
                    viewClass: view,
                    parent,
                    dom: context.document.querySelectorAll("[data-module-id='" + id + "']")[0],
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
                                    return setView(childInfo, p).then(v => {
                                        p[CHILDRENTAG].push(v);
                                    });
                                });
                            }, Promise.resolve()).then(() => p);
                        });
                    }
                    return ps.then(() => p);
                });
            });
        };
        context._steps.push("recover");
        context._bootFlow = context._bootFlow.then(() => {
            return new Promise(resolve => {
                if (/complete|loaded|interactive/.test(context.document.readyState)) {
                    setView(info, null).then(resolve);
                } else {
                    context.document.addEventListener('DOMContentLoaded', () => {
                        setView(info, null).then(resolve);
                    });
                }
            });
        }).then(() => {
            return context._invokeHook("recoverdone");
        });
    }
};

module.exports = factory;