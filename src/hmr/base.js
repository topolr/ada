let Metadata = require("../lib/metadata");
let factory = require("./../util/factory");
let {excuteStyle, getMappedPath, isFunction, parseStyle, queue, parseTemplate, setProp} = require("../util/helper");
let {ROOTELEMENTNAME, VIEWTAG} = require("../util/const");
let {DATASETRANSACTION, DATASETRANSACTIONSTATE, PREREMOVED, DDMTAG, VIEWINFO, BINDERS} = require("./../util/const");
let {TransactDataSet} = require("./../dataset");
let {DDM} = require("./../base/ddm");

class ExtendModule {
	constructor(context) {
		this._context = context;
	}

	get context() {
		return this._context;
	}

	getRootElement() {
		return this.context.document.getElementById(ROOTELEMENTNAME);
	}

	flatStateTree(stateTree) {
		let r = [];
		r.push({
			name: stateTree.name,
			state: stateTree.state,
			isTransactDataSet: stateTree.isTransactDataSet,
			history: stateTree.history,
			commits: stateTree.commits
		});
		stateTree.children.forEach(state => {
			r = r.concat(this.flatStateTree(state));
		});
		return r;
	}

	flatViews(view) {
		let r = [view];
		if (view.getChildren) {
			view.getChildren().forEach(child => {
				r = r.concat(this.flatViews(child));
			});
		}
		return r;
	}

	getStateTreeFromView(view) {
		let name = view.getClassName();
		let state = view.getCurrentState();
		let history = [];
		let isTransactDataSet = false;
		let commits = [];
		if (view.getDataSet() instanceof TransactDataSet) {
			isTransactDataSet = true;
			history = view.getDataSet()[DATASETRANSACTIONSTATE];
			commits = view.getDataSet().getTransactionList();
		}
		let children = [];
		if (view.getChildren) {
			children = view.getChildren().map(child => {
				return this.getStateTreeFromView(child);
			});
		}
		return {name, state, children, isTransactDataSet, history, commits};
	}

	injectStateTreeToView(view, stateTree) {
		let viewList = this.flatViews(view),
			stateList = this.flatStateTree(stateTree),
			theSameStructs = [];
		viewList.some((view, index) => {
			let r = !stateList[index] || view.getClassName() !== stateList[index].name;
			if (!r) {
				theSameStructs.push(view);
			}
			return r;
		});
		if (theSameStructs.length > 0) {
			return theSameStructs.reduce((a, view, index) => {
				return a.then(() => {
					if (stateList[index].isTransactDataSet && view.getDataSet() instanceof TransactDataSet) {
						view.getDataSet()[DATASETRANSACTION] = stateList[index].commits;
						view.getDataSet()[DATASETRANSACTIONSTATE] = stateList[index].history;
						return view.getDataSet().travel(stateList[index].history.length - 1);
					} else {
						return view.update(stateList[index].state);
					}
				});
			}, Promise.resolve());
		}
		return Promise.resolve();
	}

	isMapped(filepath, map) {
		let path = getMappedPath(filepath);
		return map[path] !== undefined;
	}

	setViewPreremoveState(view) {
		view[PREREMOVED] = true;
		if (view.getChildren) {
			view.getChildren().forEach(child => {
				this.setViewPreremoveState(child);
			});
		}
	}

	getViewsInModule(moduleName) {
		let views = [];
		this.context._loader.moduleLoader.scanClass((path, module) => {
			let info = Metadata.getMetadata("view", module.prototype);
			if (info && info.module === moduleName) {
				views.push(module);
			}
		});
		return views;
	}

	getViewsInPageByType(type) {
		let context = this.context;
		let r = [];
		[...context.document.querySelectorAll("[data-module]")].forEach(element => {
			let view = element[VIEWTAG];
			if (view instanceof type) {
				r.push(view);
			}
		});
		return r;
	}

	getViewsByTemplateName(templateName) {
		let views = [];
		this.context._loader.moduleLoader.scanClass((path, module) => {
			let info = Metadata.getMetadata("view", module.prototype);
			if (info && info.template === templateName) {
				views.push(module);
			}
		});
		let r = [];
		views.forEach(view => {
			r.push(...this.getViewsInPageByType(view));
		});
		return r;
	}

	getViewsByStyleName(styleName) {
		let views = [];
		this.context._loader.moduleLoader.scanClass((path, module) => {
			let info = Metadata.getMetadata("view", module.prototype);
			if (info && info.style === styleName) {
				views.push(module);
			}
		});
		let r = [];
		views.forEach(view => {
			r.push(...this.getViewsInPageByType(view));
		});
		return r;
	}

	getChangeModules(moduleNames) {
		let changeModules = [...moduleNames];
		Reflect.ownKeys(this.context._loader.moduleLoader.moduleFnsLoaded).forEach(key => {
			let source = this.context._loader.moduleLoader.moduleFnsLoaded[key].toString();
			moduleNames.forEach(file => {
				let reg = new RegExp(`require\\("${file}"\\)`);
				if (reg.test(source)) {
					if (changeModules.indexOf(key) === -1) {
						changeModules.push(key);
						this.getChangeModules([key]).forEach(n => {
							if (changeModules.indexOf(n) === -1) {
								changeModules.push(n);
							}
						});
					}
				}
			});
		});
		return changeModules;
	}

	getFutureChangedInfo(moduleNames) {
		let context = this.context;
		let r = moduleNames.map(file => {
			return {file: file, clazz: this.context._loader.moduleLoader.get(file)};
		});
		let changeInfos = [], ismainentry = false;
		[...context.document.querySelectorAll("[data-module]")].forEach(element => {
			let module = element[VIEWTAG];
			if (module) {
				for (let i = 0; i < r.length; i++) {
					let info = r[i];
					if (isFunction(info.clazz) && module instanceof info.clazz) {
						if (element === context.document.getElementById("ada-root")) {
							ismainentry = true;
							changeInfos.length = 0;
						}
						changeInfos.push({
							element,
							construct: info.clazz,
							module,
							name: info.file
						});
						if (ismainentry) {
							break;
						}
					}
				}
			}
		});
		let result = [];
		if (ismainentry) {
			result = [changeInfos[0]];
		} else {
			changeInfos.forEach(info => {
				let element = info.element, has = false;
				result.forEach(e => {
					if (e.element.contains(element)) {
						has = true;
					}
				});
				if (!has) {
					result.push(info);
				}
			});
		}
		return {
			infos: result,
			isroot: ismainentry
		};
	}

	uninstallModules(moduleNames) {
		moduleNames.forEach(file => {
			delete this.context._loader.moduleLoader.installed[file];
			delete this.context._loader.moduleLoader.moduleFnsLoaded[file];
			this.getViewsInModule(file).forEach(view => view.context.tags.remove(view));
		});
	}

	installModules(moduleNames) {
		return moduleNames.reduce((a, file) => {
			return a.then(() => {
				return this.context._loader.loadModule(file);
			});
		}, Promise.resolve());
	}

	uninstallTemplates(templateNames) {
		templateNames.forEach(temp => {
			if (this.context._loader.activeSource.cache[temp]) {
				delete this.context._loader.activeSource.cache[temp];
			}
		});
	}

	uninstallStyles(styleNames) {
		styleNames.forEach(style => {
			if (this.context._loader.activeSource.cache[style]) {
				delete this.context._loader.activeSource.cache[style];
			}
		});
	}

	resetSourceMap(map) {
		this.context.config = {
			sourceMap: map
		};
	}

	resetViewTemplate(view) {
		if (!view.isRemoved()) {
			let clazz = view.constructor, context = this.context,
				info = {...Metadata.getMetadata("view", clazz.prototype)};

			if (!info.scope) {
				info.scope = "local";
			}
			let ps = Promise.resolve();
			if (info.template) {
				ps = ps.then(() => context.loader.loadSource(info.template).then(code => {
					info.template = info.scope === "local" ? parseTemplate(code, info.className) : code;
				}));
			}
			return ps.then(() => {
				setProp(view, DDMTAG, new DDM({
					id: view.getId(),
					container: view.getDDMContainer(),
					templateStr: info.template || "",
					binders: ({method, parameters}) => {
						let info = view[BINDERS] || {};
						let _method = info[method];
						if (_method && view[_method]) {
							view[_method](parameters);
						}
					},
					option: {
						tags: view._getTags()
					},
					macro: view._macros(),
					className: info.className || "",
					context
				}));
				return view.rerender();
			});

		} else {
			return Promise.resolve();
		}
	}

	resetViewStyle(view) {
		let info = Metadata.getMetadata("view", view.constructor.prototype);
		if (!info) {
			info = Metadata.getMetadata("root", view.constructor.prototype);
		}
		let ps = Promise.resolve();
		if (info.style) {
			let id = `${info.style.replace(/\//g, "-")}:${info.className}`;
			let current = view.context.document.getElementById(id);
			if (current) {
				current.parentNode.removeChild(current);
			}
			ps = ps.then(() => this.context._loader.loadSource(info.style).then(code => {
				excuteStyle(parseStyle(code, info.className), id, this._context);
			}));
		}
		return ps;
	}

	resetView({view, clazz, element, isroot}) {
		let stateTree = null;
		if (!view.isRemoved()) {
			stateTree = this.getStateTreeFromView(view);
			this.setViewPreremoveState(view);
			if (view.getChildren) {
				view.getChildren().forEach(child => {
					if (!child.isRemoved()) {
						child.getElement().parentNode && child.getElement().parentNode.removeChild(child.getElement());
					}
				});
			}
			view.getElement().innerHTML = "";
		}
		return factory.getViewInstance({
			viewClass: clazz,
			parent: view.getParent(),
			dom: element,
			name: view.getName(),
			tag: isroot ? "root" : "view",
			context: this.context
		}).then(newview => {
			if (!view.isRemoved()) {
				let parent = view.getParent();
				if (parent) {
					let children = parent.getChildren();
					let index = children.indexOf(view);
					if (index !== -1) {
						children[index] = newview;
					}
				}
				element[VIEWTAG] = newview;
				newview.oncreated();
				return newview._render().then(() => {
					view._clean();
					return Promise.resolve().then(() => newview.onready()).then(() => {
						if (stateTree) {
							console.log("%c- Try to reset module state...", "color:#3D78A7;font-weight:bold");
							return this.injectStateTreeToView(newview, stateTree).then(() => {
								console.log("%c- Reset module state done", "color:#3D78A7;font-weight:bold");
							});
						}
					});
				});
			}
		});
	}

	replaceViews(templateNames, styleNames, map) {
		let ct = new Set(), cs = new Set();
		this.uninstallTemplates(templateNames);
		this.uninstallStyles(styleNames);
		this.resetSourceMap(map);
		templateNames.forEach(temp => {
			this.getViewsByTemplateName(temp).forEach(view => {
				ct.add(view);
			});
		});
		styleNames.forEach(style => {
			this.getViewsByStyleName(style).forEach(view => {
				cs.add(view);
			});
		});
		if (ct.size > 0) {
			console.log(`%c- Try to update [${ct.size}] views[ template ]...`, "color:#3D78A7;font-weight:bold");
		}
		if (cs.size > 0) {
			console.log(`%c- Try to update [${cs.size}] views[ style ]...`, "color:#3D78A7;font-weight:bold");
		}
		if (ct.size > 0 || cs.size > 0) {
			return queue([...ct].map(view => () => this.resetViewTemplate(view)).concat([...cs].map(view => () => this.resetViewStyle(view)))).then(() => {
				console.log("%c- Replace done.", "color:#3D78A7;font-weight:bold");
				return [];
			});
		} else {
			console.log(`%c- No view to update`, "color:#3D78A7;font-weight:bold");
			return Promise.resolve([...templateNames, ...styleNames]);
		}
	}

	replaceModules(moduleNames, map) {
		let changeModules = this.getChangeModules(moduleNames);
		console.log(`%c- Affect ${changeModules.length > 1 ? "modules" : "module"} [${changeModules.join(",")}]`, "color:#3D78A7;font-weight:bold");
		let changeInfo = this.getFutureChangedInfo(changeModules);
		this.uninstallModules(changeModules);
		this.resetSourceMap(map);
		console.log(`%c- Reset ${changeModules.length > 1 ? "modules" : "module"} and reinstall ${changeModules.length > 1 ? "them" : "it"}...`, "color:#3D78A7;font-weight:bold");
		return this.installModules(changeModules).then(() => {
			if (changeInfo.infos.length > 0) {
				console.log(`%c- Install modules done,Reset page [${changeInfo.isroot ? "From ROOT" : "From Entry"} of ${changeInfo.infos[0].module.getClassName()}]...`, "color:#3D78A7;font-weight:bold");
				console.log(`%c- Try to update [${changeInfo.infos.length}] views...`, "color:#3D78A7;font-weight:bold");
				return queue(changeInfo.infos.map(info => () => {
					let element = info.element, module = info.module, name = info.name;
					let clazz = this.context._loader.moduleLoader.get(name);
					return this.resetView({
						view: module,
						clazz,
						element,
						isroot: changeInfo.isroot
					});
				})).then(() => {
					console.log("%c- Reset page done.", "color:#3D78A7;font-weight:bold");
				});
			} else {
				console.log(`%c- Install modules done,No view to update`, "color:#3D78A7;font-weight:bold");
			}
		});
	}

	replaceAll(files, map) {
		let date = new Date();
		let info = {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
			hour: date.getHours(),
			minus: date.getMinutes(),
			second: date.getSeconds()
		};
		Reflect.ownKeys(info).forEach(key => {
			if (info[key] < 10) {
				info[key] = `0${info[key]}`;
			}
		});
		console.group(`%c[Ada] HMR ${info.year}-${info.month}-${info.day} ${info.hour}:${info.minus}:${info.second}`, "font-weight:bold");
		let temps = [], styles = [], modules = [];
		let ps = Promise.resolve([]), outmap = [];
		files = files.filter(file => {
			let ismap = this.isMapped(file, map);
			if (!ismap) {
				outmap.push(file);
			}
			return ismap;
		});
		if (files.length > 0) {
			files.forEach(file => {
				let suffix = file.split(".").pop();
				if (suffix === "html") {
					temps.push(file);
				} else if (["css", "scss", "less"].indexOf(suffix) !== -1) {
					styles.push(file);
				} else {
					modules.push(file);
				}
			});
			if (temps.length > 0 || styles.length > 0) {
				ps = ps.then(() => {
					console.log("%c- Try to replace as template or style", "color:#3D78A7;font-weight:bold");
					return this.replaceViews(temps, styles, map)
				});
			}
			return ps.then((beforeModules) => {
				let _modules = [...beforeModules, ...modules];
				if (_modules.length > 0) {
					console.log("%c- Try to replace as module", "color:#3D78A7;font-weight:bold");
					return this.replaceModules(_modules, map);
				} else {
					return Promise.resolve();
				}
			}).then(() => {
				console.groupEnd(`%cAll done.`, "font-weight:bold");
			});
		} else {
			return ps.then(() => {
				if (outmap.length > 0) {
					console.log(`%c- ${outmap.length > 1 ? "files" : "file"} [${outmap.join(",")}] ${outmap.length > 1 ? "are" : "is"} out map`, "color:#3D78A7;font-weight:bold");
				}
				console.groupEnd(`%cAll done,Nothing to update.`, "font-weight:bold");
			});
		}
	}
}

module.exports = ExtendModule;