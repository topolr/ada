const SINGLETAG = ["br", "hr", "img", "input", "param", "link", "meta", "area", "base", "basefont", "param", "col", "frame", "embed", "keygen", "source"];
const ISHTMLREG = /^\s*<(\w+|!)[^>]*>/;
const REGS = {
	k: /\r/g,
	l: /\n/g,
	a: /&lt;/g,
	b: /&gt;/g,
	d: /<%|%>/g,
	e: /^=.*;$/,
	i: /\r\n/g,
	f: />[\s]+</g,
	g: /<%[\s\S]*%>/,
	h: /\<\!\-\-[\s\S]*?\-\-\>/g,
	startdot: /&lt;/g,
	enddot: /&gt;/g,
	isDoctype: /\<\!DOCTYPE[\s\S]*?\>/g,
	isNote: /\<\!\-\-[\s\S]*?\-\-\>/g,
	isXmlTag: /\<\?[\s\S]*?\?\>/g,
	propcode: /\@\[\[[0-9]+\]\]\@/g,
	eventcode: /\$\[\[[0-9]+\]\]\$/g,
	assigncode: /\(\(\[[0-9]+\]\)\)/g,
	expresscode: /\[\[[0-9]+\]\]/g,
	nodecode: /\{\{node\}\}/g,
	prop: /[0-9a-z]+((\.)([0-9a-z_]+))+/g,
	customA: /<[\s\S]+?>/g,
	customB: /<[0-9a-z_-]+?>/,
	customC: /<[0-9a-z_-]+ .*?>/,
	customD: /<\/[0-9a-z_-]+?>/
};

const util = {
	parseStyle(text = "") {
		let r = {};
		text.split(";").forEach(item => {
			let a = item.split(":");
			r[a[0]] = a[1];
		});
		return r;
	},
	stringifyStyle(info) {
		return Reflect.ownKeys(info).filter(key => !!key).map(key => {
			return `${key}:${info[key]}`;
		}).join(";");
	}
};

class ClassList {
	constructor(node) {
		this._list = [];
		this._node = node;
	}

	add(className) {
		if (this._list.indexOf(className) === -1) {
			this._list.push(className);
		}
		this._node._props.class = this._list.join(" ");
	}

	contains(className) {
		return this._list.contains(className) !== -1;
	}

	remove(className) {
		let index = this._list.indexOf(className);
		if (index !== -1) {
			this._list.splice(index, 1);
		}
		this._node._props.class = this._list.join(" ");
	}

	toggle(className) {
		let index = this._list.indexOf(className);
		if (index === -1) {
			this._list.push(className);
		} else {
			this._list.splice(index, 1);
		}
		this._node._props.class = this._list.join(" ");
	}
}

class TextNode {
	constructor(content, parent = null) {
		this._content = content;
		this._parentNode = parent;
	}

	get parentNode() {
		return this._parentNode;
	}

	get nodeType() {
		return 3;
	}

	get textContent() {
		return this._content;
	}
}

class NodeEvent {
	constructor(type) {
		this._type = type;
		this._goon = true;
		this._target = null;
		this._currentTarget = null;
	}

	get type() {
		return this._type;
	}

	get target() {
		return this._target;
	}

	set target(target) {
		this._target = target;
	}

	get currentTarget() {
		return this._currentTarget;
	}

	set currentTarget(target) {
		this._currentTarget = target;
	}

	initEvent() {
	}

	initMouseEvent() {
	}

	initUIEvents() {
	}

	initMutationEvent() {
	}

	preventDefault() {
	}

	stopPropagation() {
		this._goon = false;
	}
}

class Node {
	constructor(tagName, parent = null) {
		this._tagName = tagName;
		this._props = {};
		this._children = [];
		this._classlist = new ClassList(this);
		this._parentNode = parent;
		this._dataset = new Proxy({}, {
			set: (target, prop, value) => {
				target[prop] = value;
				let _prop = "data-" + prop.replace(/[A-Z]+/g, str => `-${str[0].toLowerCase()}${str.substring(1)}`);
				this._props[_prop] = value;
				return true;
			},
		});
		this._listener = {};
		this._style = new Proxy({}, {
			set: (target, prop, value) => {
				if (prop === 'cssText') {
					this._props.style = value;
				} else {
					let info = util.parseStyle(this._props.style);
					info[prop] = value;
					this._props.style = util.stringifyStyle(info);
				}
				return true;
			},
			get: (target, prop) => {
				if (prop === 'cssText') {
					return this._props.style || 0;
				} else {
					return util.parseStyle(this._props.style)[prop];
				}
			}
		});
	}

	get readyState() {
		return "complete";
	}

	get nodeType() {
		return 1;
	}

	get parentNode() {
		return this._parentNode;
	}

	set parentNode(node) {
		this._parentNode = node;
	}

	get classList() {
		return this._classlist;
	}

	get tagName() {
		return this._tagName;
	}

	set tagName(tagName) {
		this._tagName = tagName;
	}

	get childNodes() {
		return this._children;
	}

	get children() {
		return this._children;
	}

	get className() {
		return this._props["class"];
	}

	get innerText() {
		let textNodes = [];
		Query.travel(this, node => {
			if (node.nodeType !== 1) {
				textNodes.push(node);
			}
		});
		return textNodes.map(ele => ele.textContent).join("\n");
	}

	get outerText() {
		return this.innerText;
	}

	get nodeName() {
		return this._tagName.toUpperCase();
	}

	get dataset() {
		return this._dataset;
	}

	get attributes() {
		return Reflect.ownKeys(this._props);
	}

	get innerHTML() {
		let str = "";
		let html = (node) => {
			let result = "", issingletag = SINGLETAG.indexOf(node.tagName) !== -1;
			if (node.nodeType !== 1) {
				result = node._content || "";
			} else {
				let _props = [];
				if (node._props) {
					Reflect.ownKeys(node._props).forEach(function (prop, i) {
						if (node._props[prop]) {
							_props.push(prop + "=\"" + node._props[prop] + "\"");
						}
					});
				}
				if (issingletag) {
					result = "<" + node.tagName + (_props.length > 0 ? " " : "") + _props.join(" ") + "/>";
				} else {
					let _content = [];
					node._children.forEach(function (child) {
						if (child) {
							_content.push(html(child));
						}
					});
					result = "<" + node.tagName + (_props.length > 0 ? " " : "") + _props.join(" ") + ">" + _content.join("") + "</" + node.tagName + ">";
				}
			}
			return result;
		};
		this._children.forEach(function (node) {
			str += html(node);
		});
		return str;
	}

	get style() {
		return this._style;
	}

	set innerHTML(content) {
		this._children.forEach(el => {
			if (el.nodeType === 1) {
				el.dispatchEvent(el.createEvent("DOMNodeRemoved"));
			}
		});
		this._children = [];
		if (ISHTMLREG.test(content)) {
			Parser.parseNode(content).forEach(e => this.appendChild(e));
		} else {
			this.appendChild(new TextNode(content));
		}
	}

	get outerHTML() {
		let result = "", issingletag = SINGLETAG.indexOf(this.tagName) !== -1;
		let _props = [];
		if (this._props) {
			Reflect.ownKeys(this._props).forEach((prop, i) => {
				if (this._props[prop]) {
					_props.push(prop + "=\"" + this._props[prop] + "\"");
				}
			});
		}
		if (issingletag) {
			result = "<" + this.tagName + " " + _props.join(" ") + "/>";
		} else {
			result = "<" + this.tagName + " " + _props.join(" ") + ">" + this.innerHTML + "</" + this.tagName + ">";
		}
		return result;
	}

	set outerHTML(content) {
		let node = Parser.parseNode(content)[0];
		if (this.parentNode) {
			let index = this.parentNode._children.indexOf(this);
			node._parentNode = this.parentNode;
			this.parentNode._children[index] = node;
		}
	}

	createElement(tag) {
		return new Node(tag);
	}

	createElementNS(name, tag) {
		let t = new Node(tag);
		t.setAttribute("xmlns", name);
		return t;
	}

	createTextNode(content) {
		return new TextNode(content);
	}

	createDocumentFragment() {
		return new NodeFragment();
	}

	getAttribute(propName) {
		return this._props[propName];
	}

	setAttribute(propName, value) {
		this._props[propName] = value;
		if (propName === "class") {
			value.split(" ").forEach(name => this.classList.add(name));
		}
		if (propName.indexOf("data-") === 0) {
			let e = propName.substring(5).replace(/-([0-9a-zA-Z])/g, (a, b) => b.toUpperCase());
			this.dataset[e] = value;
		}
	}

	getAttributeNS(ns, key) {
		let name = ns.split("/").pop();
		return this._props[`${name}:${key}`];
	}

	setAttributeNS(ns, key, value) {
		if (ns) {
			let name = ns.split("/").pop();
			this._props[`${name}:${key}`] = value;
		} else {
			this._props[`${key}`] = value;
		}
	}

	removeAttributeNS(ns, key) {
		let name = ns.split("/").pop();
		delete this._props[`${name}:${key}`];
	}

	removeAttribute(key) {
		delete this._props[key];
	}

	hasAttribute(attrName) {
		return Object.hasOwnProperty(attrName);
	}

	querySelectorAll(selector) {
		return Query.all(selector, this);
	}

	querySelector(selector) {
		return this.querySelectorAll(selector)[0];
	}

	getElementsByClassName(className) {
		return Query.className(className, this);
	}

	getElementsByTagName(tagName) {
		return Query.tag(tagName, this);
	}

	getElementById(id) {
		return Query.id(`#${id}`, this)[0];
	}

	hasChildNodes() {
		return this._children.length > 0;
	}

	contains(node) {
		let r = false;
		Query.travel(this, el => {
			if (el === node) {
				r = true;
			}
		});
		return r;
	}

	appendChild(node) {
		if (node instanceof NodeFragment) {
			node.childNodes.forEach(el => {
				el.parentNode = this;
				this._children.push(el);
			});
		} else {
			if (node._parentNode) {
				let index = node._parentNode._children.indexOf(node);
				if (index !== -1) {
					node._parentNode._children.splice(index, 1);
				}
				node._parentNode = null;
			}
			node._parentNode = this;
			this._children.push(node);
		}
	}

	removeChild(node) {
		let index = this.childNodes.indexOf(node);
		if (index !== -1) {
			let _removed = this.childNodes[index];
			_removed.dispatchEvent(_removed.createEvent("DOMNodeRemoved"));
			this._children.splice(index, 1);
		}
	}

	replaceChild(newnode, oldnode) {
		let index = this.childNodes.indexOf(oldnode);
		if (index !== -1) {
			newnode._parentNode = this;
			this._children[index] = newnode;
		}
	}

	createEvent(type) {
		return new NodeEvent(type);
	}

	addEventListener(type, fn) {
		if (!this._listener[type]) {
			this._listener[type] = [];
		}
		this._listener[type].push(fn);
	}

	removeEventListener(type, fn) {
		if (this._listener[type]) {
			let index = this._listener[type].indexOf(fn);
			if (index !== -1) {
				this._listener[type].splice(index, 1);
			}
		}
	}

	dispatchEvent(event) {
		event.target = this;
		let i = this;
		while (i) {
			i._triggerEvent(event);
			if (event._goon) {
				i = i.parentNode;
			} else {
				break;
			}
		}
	}

	createEvent(type) {
		return new NodeEvent(type);
	}

	_triggerEvent(event) {
		event.currentTarget = this;
		let type = event.type;
		if (this._listener[type]) {
			this._listener[type].forEach(fn => fn(event));
		}
	}
}

class NodeFragment extends Node {
}

const Parser = {
	preparse(str = "") {
		if (str) {
			str = str.replace(REGS.isNote, "")
				.replace(REGS.isDoctype, "")
				.replace(REGS.isXmlTag, "")
				.replace(REGS.h, "")
				.replace(REGS.f, "><");
			SINGLETAG.forEach((tag) => {
				let reg = new RegExp(`<${tag} .*?>`, "g");
				str = str.replace(reg, function (a) {
					return a.substring(0, a.length - 1) + "/>";
				});
			});
		}
		return str;
	},
	parseNode(str = "") {
		str = this.preparse(str);
		if (str && str !== "") {
			let stacks = [],
				nodes = [],
				current = null;
			let tagname = "",
				tagendname = "",
				propname = "",
				value = "",
				text = "";
			let tagnamestart = false,
				propstart = false,
				valuestart = false,
				tagendstart = false,
				element = false;

			for (let i = 0, len = str.length; i < len; i++) {
				let a = str[i];
				if (a !== "\r" && a !== "\n") {
					if (a === "<") {
						element = true;
						if (text.trim() !== "") {
							current = new TextNode(text.trim() || "", stacks[stacks.length - 1] || null);
							if (stacks[stacks.length - 1]) {
								stacks[stacks.length - 1].appendChild(current);
							} else {
								nodes.push(current);
							}
							text = "";
						}
						if (str[i + 1] && str[i + 1] === "/") {
							tagendstart = true;
						} else {
							current = new Node("", null);
							current.hasProp = false;
							stacks.push(current);
							if (stacks.length - 2 >= 0) {
								stacks[stacks.length - 2].appendChild(current);
								current.parentNode = stacks[stacks.length - 2];
							}
							tagnamestart = true;
						}
						continue;
					} else if (a === " ") {
						if (element) {
							if (tagnamestart) {
								tagnamestart = false;
								current.tagName = tagname.trim();
								tagname = "";
							}
							if (!propstart && !valuestart) {
								propstart = true;
								continue;
							}
						} else {
							text += a;
						}
					} else if (a === "=") {
						element && (propstart = false);
					} else if (a === "'" || a === "\"") {
						if (!valuestart && element) {
							valuestart = a;
							continue;
						} else {
							if (valuestart === a) {
								valuestart = false, current.hasProp = true;
								current.setAttribute(propname.trim(), value.trim());
								propname = "", value = "";
							}
						}
					} else if (a === ">") {
						element = false, propstart = false, valuestart = false, tagnamestart = false;
						if (tagendstart) {
							tagendstart = false, tagendname = "";
							stacks.length === 1 && nodes.push(stacks[0]);
							stacks.pop();
						}
						if (!current.hasProp) {
							current.tagName === "" && (current.tagName = tagname.trim());
							tagname = "";
						}
						!element && text && (text += a);
						continue;
					} else if (a === "/") {
						if (str[i + 1] && str[i + 1] === ">") {
							element = false, valuestart = false, propstart = false, tagendstart = false, tagnamestart = false, tagendname = "";
							if (stacks.length === 1) {
								nodes.push(stacks[0]);
							}
							if (!current.hasProp) {
								current.tagName === "" && (current.tagName = tagname.trim());
								tagname = "";
							}
							stacks.pop();
						} else {
							if (!element) {
								text += a;
							} else {
								valuestart && (value += a);
							}
						}
						continue;
					}
					tagnamestart && (tagname += a);
					propstart && (propname += a);
					valuestart && (value += a);
					tagendstart && (tagendname += a);
					!element && (text += a);
				} else {
					if (!element) {
						text += a;
					} else {
						valuestart && (value += a);
					}
				}
			}
			if (text) {
				nodes.push(new TextNode(text, null));
			}
			return nodes;
		} else {
			return [];
		}
	}
};

const Query = {
	travel(node, fn) {
		if (node.nodeType === 1) {
			node.childNodes.forEach(el => {
				fn(el);
				this.scan(el, fn);
			});
		} else {
			fn(node);
		}
	},
	scan(node, fn) {
		if (node.nodeType === 1) {
			node.childNodes.forEach(el => {
				if (el.nodeType === 1) {
					fn(el);
					this.scan(el, fn);
				}
			});
		}
	},
	all(selector, node) {
		let result = [];
		selector.split(" ").forEach((sel, index) => {
			if (index === 0) {
				if (sel.indexOf("#") !== -1) {
					result = this.id(sel, node);
				} else if (sel.indexOf(".") !== -1) {
					result = this.className(sel, node);
				} else if (sel.indexOf("[") !== -1) {
					result = this.prop(sel, node);
				} else {
					result = this.tag(sel, node);
				}
			} else {
				if (result.length !== 0) {
					let _result = [];
					if (sel.indexOf("#") !== -1) {
						result.forEach(node => {
							_result = _result.concat(this.id(sel, node));
						});
					} else if (sel.indexOf(".") !== -1) {
						result.forEach(node => {
							_result = _result.concat(this.className(sel, node));
						});
					} else if (sel.indexOf("[") !== -1) {
						result.forEach(node => {
							_result = _result.concat(this.prop(sel, node));
						});
					} else {
						result.forEach(node => {
							_result = _result.concat(this.tag(sel, node));
						});
					}
					result = _result;
				}
			}
		});
		return result;
	},
	tag(tagName, node) {
		let els = [];
		this.scan(node, el => {
			if (el.tagName === tagName) {
				els.push(el);
			}
		});
		return els;
	},
	id(idSelector, node) {
		let id = idSelector.substring(1);
		let els = [];
		this.scan(node, el => {
			if (el._props.id && el._props.id === id) {
				els.push(el);
			}
		});
		return els;
	},
	className(classSelector, node) {
		let cls = classSelector.split(".");
		cls.shift();
		let els = [];
		this.scan(node, el => {
			let a = cls.find(c => el.classList._list.indexOf(c) === -1);
			if (!a) {
				els.push(el);
			}
		});
		return els;
	},
	prop(propSelector, node) {
		let info = propSelector.match(/([a-zA-Z\*]*)\[([a-zA-Z-]+)([\~\=\^\*\$\|]*)([\s\S]*)\]/);
		let els = [];
		if (info) {
			let tagName = info[1], propName = info[2], operator = info[3],
				value = info[4].substring(1, info[4].length - 1);
			this.scan(node, el => {
				let target = true;
				if (tagName !== "" && tagName !== "*") {
					target = el.tagName === tagName;
				}
				if (target && operator) {
					let _val = el._props[propName] || "";
					if (operator === "=") {
						target = _val === value;
					}
					if (operator === "~=") {
						target = _val.split(" ").indexOf(value) !== -1;
					}
					if (operator === "|=") {
						target = _val.substring(0, value.length + 1) === `${value}_`;
					}
					if (operator === "^=") {
						target = _val.startsWith(value);
					}
					if (operator === "$=") {
						target = _val.endsWith(value);
					}
					if (operator === "*=") {
						target = _val.indexOf(value) !== -1;
					}
				}
				if (target) {
					els.push(el);
				}
			});
		}
		return els;
	}
};

module.exports = Node;