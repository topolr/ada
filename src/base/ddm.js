let eventHelper = require("../lib/event");
let Collector = require("./collector");
let {encodeHTML, isFunction, isPlainObject, randomid} = require("../util/helper");
let {PROXYSTATE, VIEWTAG} = require("./../util/const");

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
	assigncodex: /\(\(\[[0-9]+\]\)\)/,
	assigncodeonly: /^\(\(\[[0-9]+\]\)\)$/,
	expresscode: /\[\[[0-9]+\]\]/g,
	nodecode: /\{\{node\}\}/g,
	prop: /[0-9a-z]+((\.)([0-9a-z_]+))+/g,
	customA: /<[\s\S]+?>/g,
	customB: /<[0-9a-z_-]+?>/,
	customC: /<[0-9a-z_-]+ .*?>/,
	customD: /<\/[0-9a-z_-]+?>/,
	customE: /<[0-9a-z_-]+\/?>/
};
const SINGLETAG = ["br", "hr", "img", "input", "param", "link", "meta", "area", "base", "basefont", "param", "col", "frame", "embed", "keygen", "source"];
const TEMPLATECACHE = new Map();
const IDNAME = "$$ID";

let SelfCloseTags = [...SINGLETAG];

let Parser = {
	beautySyntax: {
		syntaxs: {
			defaults(str) {
				return `<%=${str.substring(2, str.length - 2)};%>`;
			},
			log(str) {
				return `<%window.Ada.log?window.Ada.log(${str.join(" ")}):console.log(${str.join(" ")});%>`;
			},
			html(str) {
				return `<%=assign(html,${str.filter(a => !!a).join(",")});%>`;
			},
			map(a) {
				let dataname = a.shift();
				a.shift();
				let keyname = a.shift() || "$value",
					indexname = a.shift() || "$key",
					iname = "_" + randomid(8);
				return `<%for(var ${iname} in ${dataname}){var ${keyname}=${dataname}[${iname}];var ${indexname}=${iname};%>`;
			},
			"/map"() {
				return "<%}%>";
			},
			list(a) {
				var dataname = a.shift();
				a.shift();
				let keyname = a.shift() || "$item",
					indexname = a.shift() || "$index",
					iname = "_" + randomid(8),
					lenname = "_" + randomid(6);
				return `<%if(${dataname}&&${dataname}.length>=0)for(var ${iname}=0,${indexname}=0,${lenname}=${dataname}.length;${iname}<${lenname};${iname}++){var ${keyname}=${dataname}[${iname}];${indexname}=${iname};%>`;
			},
			"/list"(str) {
				return "<%}%>";
			},
			if(str) {
				return `<%if(${str.join(" ")}){%>`;
			},
			"elseif"(str) {
				return `<%}else if(${str.join(" ")}){%>`;
			},
			"else"() {
				return "<%}else{%>";
			},
			"/if"() {
				return "<%}%>";
			},
			break() {
				return "<%break;%>";
			},
			set(str) {
				return `<%var ${str.join(" ")};%>`;
			}
		},
		parse(strs = "") {
			return strs.replace(/\{\{[\s\S]+?\}\}/g, (str) => {
				let a = str.substring(2, str.length - 2),
					b = a.split(" "),
					c = b.shift();
				try {
					if (Parser.beautySyntax.syntaxs[c]) {
						return Parser.beautySyntax.syntaxs[c](b);
					} else {
						return Parser.beautySyntax.syntaxs.defaults(str);
					}
				} catch (e) {
					console.log(e);
				}
			});
		}
	},
	nodeParser: {
		getNodeStr(node) {
			let _events = {}, _attrs = {}, _props = {}, _binders = [];
			Reflect.ownKeys(node.props).forEach(function (key) {
				if (key.startsWith("on")) {
					let _key = key.substring(2);
					_events[_key] = node.props[key];
					_binders.push(_key);
				} else if (key.startsWith("@")) {
					let _key = key.substring(1);
					_props[_key] = node.props[key];
				} else if (key === "data-find") {
					_attrs["data-find"] = `${IDNAME}+":${node.props["data-find"]}"`;
				} else if (key === "data-group") {
					_attrs["data-group"] = `${IDNAME}+":${node.props["data-group"]}"`;
				} else if (key === "data-module") {
					_attrs["data-module"] = `${IDNAME}`;
				} else {
					_attrs[key] = `"${node.props[key]}"`;
				}
			});
			if (_binders.length > 0) {
				_attrs["data-bind"] = `${IDNAME}+":${_binders.join(",")}"`;
			}
			return `{tag:"${node.tag}",attrs:{${
				Reflect.ownKeys(_attrs).map(i => `"${i}":${_attrs[i]}`).join(",")
				}},events:{${
				Reflect.ownKeys(_events).map(i => `${i}:$${_events[i]}$`).join(",")
				}},props:{${
				Reflect.ownKeys(_props).map(i => {
					if (_props[i][0] === "\"") {
						return `${i}:${_props[i]}`;
					} else {
						return `${i}:@${_props[i]}@`;
					}
				}).join(",")
				}},children:[]}`;
		},
		code(node, lev) {
			if (!node.isTextNode) {
				let pname = "", t = "";
				let tempstr = Parser.nodeParser.getNodeStr(node);
				if (!node.parent) {
					pname = "$$NODE" + lev;
					t = `var ${pname}=${tempstr};$$CURRENT=${pname};`;
				} else {
					pname = "$$NODE" + lev;
					t = `${tempstr};$$CURRENT=${pname};`;
				}
				node.children.forEach(child => {
					if (child.isTextNode && (/\(\[[0-9]+\]\)/).test(child.content)) {
						t += child.content;
					} else {
						let at = lev.split("_");
						lev = `${at[0]}_${at[1] / 1 + 1}`;
						let q = `$$NODE${lev}`;
						let _tempstr = Parser.nodeParser.code(child, lev);
						t += `var ${q}=${_tempstr}; ${pname}.children.push(${q}); $$CURRENT=${pname};`;
					}
				});
				return t;
			} else {
				let tempstr = "";
				if (!(/\(\[[0-9]+\]\)/).test(node.content)) {
					tempstr = `{content:"${node.content || ""}"}`;
				} else {
					tempstr = node.content;
				}
				return tempstr;
			}
		}
	},
	getHTMLString(context, nodes) {
		let str = "";

		let html = (node) => {
			let result = "", issingletag = SINGLETAG.indexOf(node.tag) !== -1;
			if (node.content !== undefined) {
				if (node.type === undefined) {
					result = encodeHTML(node.content, context) || "";
				} else {
					let _adtype = node.type;
					let _code = node.content;
					if (context.ddm.defaultAssignDirectives[_adtype]) {
						_code = context.ddm.defaultAssignDirectives[_adtype](node.content);
					}
					result = "<div class=\"ada-assign-directive\" data-assign-directive-type=\"" + _adtype + "\">" + (_code || '') + "</div>";
				}
			} else {
				let _props = [];
				if (node.attrs) {
					Reflect.ownKeys(node.attrs).forEach(function (prop, i) {
						if (node.attrs[prop]) {
							_props.push(prop + "=\"" + node.attrs[prop] + "\"");
						}
					});
				}
				if (issingletag) {
					result = "<" + node.tag + " " + _props.join(" ") + "/>";
				} else {
					let _content = [];
					node.children.forEach(function (child) {
						if (child) {
							_content.push(html(child));
						}
					});
					result = "<" + node.tag + " " + _props.join(" ") + ">" + _content.join("") + "</" + node.tag + ">";
				}
			}
			return result;
		};

		nodes.forEach(function (node) {
			str += html(node);
		});
		return str;
	},
	preparse(context, str = "", tags = {}) {
		str = this.parseCustomTag(context, str.trim(), tags)
			.replace(REGS.isNote, "")
			.replace(REGS.isDoctype, "")
			.replace(REGS.isXmlTag, "")
			.replace(REGS.a, "<")
			.replace(REGS.b, ">")
			.replace(REGS.h, "")
			.replace(REGS.f, "><")
			.replace(REGS.i, "")
			.replace(REGS.k, "")
			.replace(REGS.l, "");
		[...SelfCloseTags, ...Reflect.ownKeys(tags).filter(name => {
			let generator = tags[name];
			if (!isFunction(generator)) {
				return generator.selfClose === true;
			}
		})].forEach((tag) => {
			let reg = new RegExp(`<${tag} .*?>`, "g");
			str = str.replace(reg, function (a) {
				return a.substring(0, a.length - 1) + "/>";
			});
		});
		return str;
	},
	parseCustomTag(context, code, tags = {}) {
		return code.replace(REGS.customA, (str) => {
			return str.replace(REGS.customB, (str) => {
				let tagName = str.substring(1, str.length - 1);
				if (context.tags.has(tagName) || tags[tagName] !== undefined) {
					return `<@custom @customTagName="${tagName}">`;
				} else {
					if (!context.tags.isRegularTag(tagName)) {
						console.warn(`[ada] tag [${tagName}] seemed not supported`);
					}
					return str;
				}
			}).replace(REGS.customE, (str) => {
				let tagName = str.substring(1, str.length - 2);
				if (context.tags.has(tagName) || tags[tagName] !== undefined) {
					return `<@custom @customTagName="${tagName}"/>`;
				} else {
					if (!context.tags.isRegularTag(tagName)) {
						console.warn(`[ada] tag [${tagName}] seemed not supported`);
					}
					return str;
				}
			}).replace(REGS.customC, (str) => {
				let info = str.split(" ");
				let tagName = info.shift().substring(1);
				if (context.tags.has(tagName) || tags[tagName] !== undefined) {
					info.unshift(`<@custom @customTagName="${tagName}"`);
					return info.join(" ");
				} else {
					if (!context.tags.isRegularTag(tagName)) {
						console.warn(`[ada] tag [${tagName}] seemed not supported`);
					}
					return str;
				}
			}).replace(REGS.customD, (str) => {
				let tagName = str.substring(2, str.length - 1);
				if (context.tags.has(tagName) || tags[tagName] !== undefined) {
					return "</@custom>";
				} else {
					if (!context.tags.isRegularTag(tagName)) {
						console.warn(`[ada] tag [${tagName}] seemed not supported`);
					}
					return str;
				}
			});
		});
	},
	parseMacro(str = "") {
		if (str.indexOf("<@") !== -1) {
			let i = -1, current = "", state = "start", tagname = "", propname = "", propnamestart, propvalue = "";
			let isbody = true, endtagname = "", props = {}, tagindex = 0, tagendindex = 0, endtagindex = 0,
				endtagendindex = 0, obj = [];
			while (i < str.length) {
				i++;
				current = str[i];
				if (state === "start" && current === "<" && str[i + 1] === "@") {
					state = "tagstart";
					tagindex = i;
					continue;
				}
				if (state === "tagstart" && current === "@") {
					state = "tagname";
					tagname = "";
					props = {};
					continue;
				}
				if (state === "start" && current === "<" && str[i + 1] === "/" && str[i + 2] === "@") {
					endtagindex = i;
					state = "endtag";
					endtagname = "";
					i += 2;
					continue;
				}
				if (state === "endtag" && current === ">") {
					state = "start";
					endtagendindex = i + 1;
					obj.push({
						type: "endtag",
						tagname: endtagname,
						start: endtagindex,
						end: endtagendindex
					});
					continue;
				}
				if (state === "tagname" && current === " ") {
					state = "propname";
					propname = "";
					continue;
				}
				if (state === "tagname" && (current === "/" || current === ">")) {
					if (current === ">") {
						tagendindex = i + 1;
						state = "start";
						isbody = true;
					} else if (current === "/") {
						tagendindex = i + 2;
						state = "start";
						isbody = false;
					}
					if (tagname !== "") {
						obj.push({
							type: "tag",
							tagname: tagname,
							props: props,
							body: isbody,
							start: tagindex,
							end: tagendindex
						});
					}
					continue;
				}
				if (state === "propname" && current === "=") {
					state = "propvalue";
					continue;
				}
				if (state === "propvalue" && (current === "'" || current === "\"")) {
					state = "propvalueing";
					propnamestart = current;
					propvalue = "";
					continue;
				}
				if (state === "propvalueing" && current === propnamestart) {
					state = "tagname";
					props[propname] = propvalue;
					continue;
				}
				if (state === "endtag") {
					endtagname += current;
				}
				if (state === "tagname") {
					tagname += current;
				}
				if (state === "propname") {
					propname += current;
				}
				if (state === "propvalueing") {
					propvalue += current;
				}
			}
			let index = 0, start = 0, end = 0, inner = false, _current = null, result = [], vt = "", startin = 0;
			Reflect.ownKeys(obj).forEach(key => {
				let _info = obj[key];
				if (_info.type === "tag" && _info.body === false && inner === false) {
					_info.bodystr = "";
					_info.from = _info.start;
					_info.to = _info.end;
					result.push(_info);
				}
				if (_info.type === "tag" && _info.body === true) {
					inner = true;
					if (_current === null) {
						_current = _info;
						_current.from = _info.start;
					}
					if (index === 0) {
						start = _info.start;
						end = _info.end;
					}
					index++;
				}
				if (_info.type === "endtag") {
					index--;
					if (index === 0) {
						_current.to = _info.end;
						_current.bodystr = str.substring(end, _info.start);
						result.push(_current);
						_current = null;
						inner = false;
					}
				}
			});
			result.forEach(item => {
				let macroProps = item.props;
				let _event = [], _props = [], _attrs = [], _useprops = [], _usepropsmap = [];
				Reflect.ownKeys(macroProps).forEach(macroAttrName => {
					let macroPropsValStr = macroProps[macroAttrName];
					let macroPropsValue = "";
					if (REGS.g.test(macroPropsValStr)) {
						let cpp = "";
						macroPropsValStr.split(REGS.d).forEach((val, index) => {
							if ((index + 1) % 2 === 0) {
								if (val !== "") {
									cpp += `${val}+`;
								}
							} else {
								if (val !== "") {
									cpp += `'${val}'+`;
								} else {
									cpp += val;
								}
							}
						});
						let npp = cpp.length > 0 ? cpp.substring(0, cpp.length - 1) : "''";
						macroPropsValue = npp.substring(1, npp.length - 1);
					} else {
						macroPropsValue = `"${macroPropsValStr}"`;
					}
					if (macroAttrName.startsWith("on")) {
						let _eventtype = macroAttrName.substring(2);
						_event.push({name: _eventtype, value: macroPropsValue});
					} else if (macroAttrName.startsWith("@")) {
						_props.push(`"${macroAttrName.substring(1)}":${macroPropsValue}`);
						if (macroAttrName.substring(1).trim() === "parameter") {
							let t = macroPropsValue.match(REGS.prop);
							if (t) {
								t.forEach(p => {
									_useprops.push(p);
									let e = p.split(".");
									e.pop();
									_usepropsmap.push(`"${p}":${p}`);
									_usepropsmap.push(`"${e.join(".")}":${e.join(".")}`);
								});
							}
						}
					} else {
						_attrs.push(`"${macroAttrName}":${macroPropsValue}`);
					}
				});
				let _event_ = _event.map(info => {
					let _val = info.value.split(/\(|\)/);
					let method = _val.shift();
					_val.pop();
					let paranames = [];
					let parameters = _val.map(a => {
						if (a.indexOf(" as ") !== -1) {
							let _b = a.split("as");
							paranames.push(`${_b[1].trim()}`);
							return _b[0].trim();
						} else {
							paranames.push(`${a.split(".").pop()}`);
							return a;
						}
					});
					return `"${info.name}":{method:"${method}",parameters:[${parameters.join(",")}],paranames:"${paranames.join(",")}"}`;
				});
				vt += `${str.substring(startin, item.from)}<%var $$MACRORESULT=this._macro({tag:"${item.tagname}",props:{${_props.join(",")}},attrs:{${_attrs.join(",")}},events:{${_event_.join(",")}},bodyStr:"${item.bodystr}",uses:[${_useprops.map(a => "'" + a + "'").join(",")}],usesmap:{${_usepropsmap.join(",")}}});if({{node}}){if($$MACRORESULT&&$$MACRORESULT.length){for(var $$INDEX=0;$$INDEX<$$MACRORESULT.length;$$INDEX++){{{node}}.children.push($$MACRORESULT[$$INDEX]);}}else{{{node}}.children.push({content:$$MACRORESULT||''});}}else{if($$MACRORESULT&&$$MACRORESULT.length){$$RESULT=$$RESULT.concat($$MACRORESULT);}else{$$RESULT.push({content:$$MACRORESULT||''});}}%>`;
				startin = item.to;
			});
			vt += str.substring(startin, str.length);
			return vt;
		} else {
			return str;
		}
	},
	parseNode(str = "") {
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
							current = {
								content: text.trim() || "",
								parent: stacks[stacks.length - 1] || null,
								isTextNode: true
							};
							if (stacks[stacks.length - 1]) {
								stacks[stacks.length - 1].children.push(current);
							} else {
								nodes.push(current);
							}
							text = "";
						}
						if (str[i + 1] && str[i + 1] === "/") {
							tagendstart = true;
						} else {
							current = {
								tag: "",
								props: {},
								children: [],
								parent: null,
								hasProp: false,
								isTextNode: false
							};
							stacks.push(current);
							if (stacks.length - 2 >= 0) {
								stacks[stacks.length - 2].children.push(current);
								current.parent = stacks[stacks.length - 2];
							}
							tagnamestart = true;
						}
						continue;
					} else if (a === " ") {
						if (element) {
							if (tagnamestart) {
								tagnamestart = false;
								current.tag = tagname.trim();
								tagname = "";
							}
							if (!propstart && !valuestart) {
								propstart = true;
								continue;
							}
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
								current.props[propname.trim()] = value.trim();
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
							current.tag === "" && (current.tag = tagname.trim());
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
								current.tag === "" && (current.tag = tagname.trim());
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
				}
			}
			if (text) {
				nodes.push({content: text || "", parent: null, isTextNode: true});
			}
			return nodes;
		} else {
			return [];
		}
	},
	reparseNode(nodes) {
		nodes.forEach(node => {
			if (node.isTextNode) {
				if (node.parent && REGS.assigncodex.test(node.content)) {
					if (!REGS.assigncodeonly.test(node.content)) {
						let t = [], r = [];
						node.content.replace(REGS.assigncode, str => {
							t.push({
								content: str,
								isTextNode: true,
								parent: node.parent
							});
							return str;
						}).split(REGS.assigncodex).forEach(txt => {
							if (txt.trim()) {
								r.push({
									content: txt,
									isTextNode: true,
									parent: node.parent
								});
							}
							let m = t.shift();
							if (m) {
								r.push(m);
							}
						});
						node.parent.children.splice(node.parent.children.indexOf(node), 1, ...r);
					}
				}
			} else {
				this.reparseNode(node.children);
			}
		});
		return nodes;
	},
	code(temp = "") {
		let fn = "", outp = "", cc = [], ee = [];
		let t = `"use strict";\nvar $$RESULT=[],$$CURRENT=null;\n`;
		temp.split(REGS.d).forEach((e, index) => {
			if (index % 2 !== 0) {
				if (REGS.e.test(e)) {
					fn += outp + `[[${cc.length}]]`;
					cc.push(e);
				} else {
					fn += `(([${ee.length}]))`;
					ee.push(e);
				}
			} else {
				fn += outp + e;
			}
		});
		Parser.reparseNode(Parser.parseNode(fn)).forEach((item, i) => {
			let pt = i + "_0";
			let ct = Parser.nodeParser.code(item, pt);
			t += ct + "\r\n";
			if (ct.indexOf("$$NODE" + pt) !== -1 && ct.indexOf("$$RESULT.push($$NODE" + pt + ")") === -1) {
				t += "$$RESULT.push($$NODE" + pt + ");$$CURRENT=null;\r\n";
			}
		});
		t = t.replace(REGS.assigncode, (a, b, c) => {
			return ee[a.substring(3, a.length - 3)];
		}).replace(REGS.propcode, (a, b, c) => {
			let aa = cc[a.substring(3, a.length - 3)];
			if (aa && aa[0] === "=") {
				return aa.substring(1, aa.length - 1);
			} else {
				return aa;
			}
		}).replace(REGS.eventcode, (a, b, c) => {
			let aa = cc[a.substring(3, a.length - 3)];
			if (aa && aa[0] === "=") {
				let qt = aa.substring(1, aa.length - 1), qtt = qt.split(/\(|\)/);
				let paranames = [], _paranames = [];
				if (qtt[1]) {
					paranames = qtt[1].split(",").map(name => {
						if (name.indexOf(" as ") !== -1) {
							return name.split("as").pop().trim();
						} else {
							return name.indexOf(".") !== -1 ? name.split(".").pop() : name;
						}
					});
					_paranames = qtt[1].split(",").map(name => {
						if (name.indexOf(" as ") !== -1) {
							return name.split("as").shift().trim();
						} else {
							return name;
						}
					});
				}
				return `{method:"${qtt[0].trim()}",parameters:[${_paranames.join(",") || ''}],paranames:"${paranames.join(",")}"}`;
			} else {
				return aa;
			}
		}).replace(REGS.expresscode, (a, b, c) => {
			let aa = cc[a.substring(2, a.length - 2)];
			if (aa && aa[0] === "=") {
				let et = aa.substring(1, aa.length - 1);
				if (et.indexOf("assign(") === 0) {
					et = et.substring(7, et.length - 1);
					let _et = et.split(",");
					let _type = _et.shift(), _code = _et.join(",");
					return `"+((${_code})!==undefined?(${_code}):''),"type":"${_type}`;
				} else {
					return `"+((${et})!==undefined?(${et}):'')+"`;
				}
			} else {
				return aa;
			}
		}).replace(REGS.nodecode, (a, b, c) => "$$CURRENT");
		t += "return $$RESULT;";
		return t;
	},
	parse(context, temp = "", tags = {}) {
		let result = "";
		if (!TEMPLATECACHE.has(temp)) {
			result = Parser.code(Parser.parseMacro(Parser.beautySyntax.parse(Parser.preparse(context, temp, tags))));
			TEMPLATECACHE.set(temp, result);
		} else {
			result = TEMPLATECACHE.get(temp);
		}
		return result;
	}
};
let Differ = {
	childrenEvents(children = []) {
		let bubbleEvents = new Set();
		let unBubbleEvents = {};

		function walk(node) {
			if (node.events) {
				Reflect.ownKeys(node.events).forEach(type => {
					if (eventHelper.canBubbleUp(type)) {
						bubbleEvents.add(type);
					} else {
						let name = node.attrs["data-bind"];
						if (!unBubbleEvents[name]) {
							unBubbleEvents[name] = [];
						}
						if (unBubbleEvents[name].indexOf(type) === -1) {
							unBubbleEvents[name].push(type);
						}
					}
				});
				if (!node.attrs || !node.attrs["data-module"]) {
					node.children && node.children.forEach(child => walk(child));
				}
			}
		}

		children.forEach(child => walk(child));
		return {
			bubbleEvents: Array.from(bubbleEvents),
			unBubbleEvents
		};
	},
	diffNode(a, b, current, r) {
		if (a && b) {
			let lent = a.length;
			if (a.length === 0) {
				if (b.length !== 0) {
					r.removeAll.push({
						path: current.join(",")
					});
				}
			} else {
				if (a[0].attrs && a[0].attrs.uid && b[0] && b[0].attrs && b[0].attrs.uid) {
					let removeInfos = [], addInfos = [], sortInfos = [], aIds = [], bIds = [];
					if (a.length < b.length) {
						aIds = a.map(node => node.attrs.uid);
						b = b.filter((node, index) => {
							if (aIds.indexOf(node.attrs.uid) === -1) {
								removeInfos.push(index);
							} else {
								return true;
							}
						});
					} else if (a.length > b.length) {
						b = b.map(node => {
							bIds.push(node.attrs.uid);
							return node;
						});
						a.forEach((node, index) => {
							let id = node.attrs.uid;
							aIds.push(id);
							if (bIds.indexOf(id) === -1) {
								bIds.push(node.attrs.uid);
								addInfos.push({node, index});
								b.push(node);
							}
						});
					} else {
						aIds = a.map(node => node.attrs.uid);
					}
					let result = [];
					b.forEach((node, i) => {
						let id = node.attrs.uid, to = aIds.indexOf(id);
						if (to !== -1 && to !== i) {
							sortInfos.push({node, from: i, to});
							result[to] = node;
						} else {
							result[i] = node;
						}
					});
					b = result;
					removeInfos.forEach((removeIndex) => {
						r.bremove.push({
							path: current.join(",") + (current.length > 0 ? "," : '') + removeIndex
						});
					});
					addInfos.forEach(info => {
						r.badd.push({
							path: current.join(","),
							node: info.node
						});
					});
					sortInfos.map(info => {
						r.sort.push({
							path: current.join(",") + (current.length > 0 ? "," : '') + info.from,
							to: info.to,
							from: info.from
						});
						let from = b[info.from];
						b[info.from] = b[info.to];
						b[info.to] = from;
					});
				} else {
					if (a.length < b.length) {
						lent = b.length;
					}
				}
				if (b.length > a.length) {
					lent = b.length;
				}
				for (let i = 0; i < lent; i++) {
					current.push(i);
					if (a[i]) {
						if (b[i]) {
							if (!(a[i].attrs && a[i].attrs["data-module"] !== undefined)) {
								let ctp = Differ.checkNode(a[i], b[i]);
								if (b[i].attrs && b[i].attrs["data-module"] !== undefined) {
									r.replace.push({
										path: current.join(","),
										node: a[i]
									});
								} else {
									if (ctp === true) {
										Differ.diffNode(a[i].children, b[i].children, current, r);
									} else if (ctp === "replace") {
										r.replace.push({
											path: current.join(","),
											node: a[i]
										});
									} else {
										r.edit.push({
											path: current.join(","),
											attrs: ctp
										});
										Differ.diffNode(a[i].children, b[i].children, current, r);
									}
								}
							} else if (a[i].attrs["data-module"] !== undefined) {
								let ctp = Differ.checkNode(a[i], b[i]);
								if (ctp === "replace") {
									r.replace.push({
										path: current.join(","),
										node: a[i]
									});
								} else if (ctp !== true) {
									r.edit.push({
										path: current.join(","),
										attrs: ctp
									});
								}
							}
						} else {
							r.add.push({
								path: current.join(","),
								node: a[i]
							});
						}
					} else {
						r.remove.push({
							path: current.join(","),
							node: b[i]
						});
					}
					current.pop();
				}
			}
		}
	},
	checkNode(a, b) {
		let r = true;
		if (a.content !== undefined) {
			if (a.content === b.content) {
				r = true;
			} else {
				r = "replace";
			}
		} else {
			if (a.tag === b.tag) {
				let left = a.attrs && a.attrs["data-module"],
					right = b.attrs && b.attrs["data-module"];
				if (left !== right) {
					return "replace";
				} else {
					return Differ.checkProps(a.attrs, b.attrs);
				}
			} else {
				r = "replace";
			}
		}
		return r;
	},
	checkProps(a, b) {
		let ap = Object.keys(a),
			bp = Object.keys(b),
			r = {final: a},
			t = ap.length,
			isedit = false;
		if (ap.length < bp.length) {
			t = bp.length;
		}
		for (let i = 0; i < t; i++) {
			let key = ap[i];
			if (key) {
				if (b[key] === undefined) {
					isedit = true;
					break;
				} else {
					if (a[key] !== b[key]) {
						isedit = true;
						break;
					}
				}
			} else {
				isedit = true;
				break;
			}
		}
		if (isedit) {
			return r;
		} else {
			return true;
		}
	},
	diff(newnode, oldnode) {
		let r = {add: [], replace: [], remove: [], edit: [], removeAll: [], bremove: [], badd: [], sort: []},
			current = [];
		let a = Differ.diffNode(newnode, oldnode, current, r);
		oldnode = [];
		return r;
	}
};
let Effecter = {
	element(context, data, issvg) {
		if (data.tag === "svg") {
			!issvg ? (issvg = true) : "";
		}
		if (data.content !== undefined) {
			if (issvg) {
				return context.document.createElementNS("http://www.w3.org/2000/svg", "text");
			} else {
				if (data.type === undefined) {
					return context.document.createTextNode(data.content);
				} else {
					let _adtype = data.type, _code = data.content;
					if (context.ddm.defaultAssignDirectives[_adtype]) {
						_code = context.ddm.defaultAssignDirectives[_adtype](data.content);
					}
					let rtn = context.document.createElement("div");
					rtn.setAttribute("class", "ada-assign-directive");
					rtn.setAttribute("data-assign-directive", _adtype);
					rtn.innerHTML = _code || "";
					return rtn;
				}
			}
		} else {
			let t = null;
			if (!issvg) {
				t = context.document.createElement(data.tag);
			} else {
				t = context.document.createElementNS("http://www.w3.org/2000/svg", data.tag);
			}
			for (let i in data.attrs) {
				if (!issvg) {
					t.setAttribute(i, data.attrs[i]);
				} else {
					let a = i.split(":");
					if (a.length > 1) {
						t.setAttributeNS("http://www.w3.org/1999/" + a[0], a[1], data.attrs[i]);
					} else {
						t.setAttributeNS(null, a[0], data.attrs[i]);
					}
				}
			}
			for (let i = 0; i < data.children.length; i++) {
				t.appendChild(Effecter.element(context, data.children[i], issvg));
			}
			return t;
		}
	},
	effect(context, dom, actions) {
		context.logger.log(`> DDM : Badd:${actions.badd.length} Add:${actions.add.length} Replace:${actions.replace.length} Remove:${actions.remove.length} Edit:${actions.edit.length} RemoveAll:${actions.removeAll.length} Bremove:${actions.bremove.length} Sort:${actions.sort.length}`);
		let adds = {};
		actions.badd.forEach(action => {
			let t = dom;
			if (action.path.trim()) {
				action.path.split(",").forEach(path => {
					t = t.childNodes[path / 1];
				});
			}
			t.appendChild(Effecter.element(context, action.node));
		});
		actions.bremove.map(remove => {
			let t = dom;
			if (remove.path.trim()) {
				remove.path.split(",").forEach(path => {
					t = t.childNodes[path / 1];
				});
			}
			return t;
		}).forEach(node => node.parentNode.removeChild(node));
		if (actions.sort.length > 0) {
			let sorts = actions.sort.map(info => {
				let t = dom;
				if (info.path.trim()) {
					info.path.split(",").forEach(path => {
						t = t.childNodes[path / 1];
					});
				}
				return {
					node: t,
					to: info.to,
					from: info.from
				};
			});
			let mt = [...sorts[0].node.parentNode.childNodes];
			sorts.forEach(sort => {
				let a = mt[sort.to];
				mt[sort.to] = sort.node;
			});
			let parent = mt[0].parentNode;
			let fragment = context.document.createDocumentFragment();
			for (let i = 0; i < mt.length; i++) {
				fragment.appendChild(mt[i]);
			}
			parent.appendChild(fragment);
		}
		actions.replace.forEach(action => {
			let t = dom, has = false;
			if (action.path.trim()) {
				action.path.split(",").forEach(path => {
					let q = t.childNodes[path / 1];
					if (q) {
						t = q;
						has = true;
					} else {
						has = false;
						t.appendChild(Effecter.element(context, action.node));
					}
				});
			}
			if (has) {
				t.parentNode.replaceChild(Effecter.element(context, action.node), t);
			}
		});
		actions.add.forEach(action => {
			let t = dom;
			let paths = action.path.split(",");
			paths.pop();
			let pname = paths.join("");
			paths.forEach(path => {
				t = t.childNodes[path / 1];
			});
			if (!adds[pname]) {
				adds[pname] = [{
					p: t,
					n: action.node
				}];
			} else {
				adds[pname].push({
					p: t,
					n: action.node
				});
			}
		});
		actions.edit.forEach(action => {
			let t = dom;
			if (action.path.trim()) {
				action.path.split(",").forEach(path => t = t.childNodes[path / 1]);
			}
			let attrs = action.attrs, attributes = [];
			if (t.attributes.getNamedItem) {
				attributes = [...t.attributes].map(attribute => attribute.nodeName);
			} else {
				for (let nt in t.attributes) {
					attributes.push(nt);
				}
			}
			Reflect.ownKeys(attrs.final).forEach(propName => {
				if (propName.indexOf(":") === -1) {
					if (t.getAttribute(propName) !== attrs.final[propName]) {
						t.setAttribute(propName, attrs.final[propName]);
						try {
							t[propName] = attrs.final[propName];
						} catch (e) {
						}
					}
					let etm = attributes.indexOf(propName);
					if (etm !== -1) {
						attributes.splice(etm, 1);
					}
				} else {
					let to = propName.split(":"), top = to[1], stop = to[0];
					if (t.getAttributeNS("http://www.w3.org/1999/" + stop, top) !== attrs.final[propName]) {
						t.setAttributeNS("http://www.w3.org/1999/" + stop, top, attrs.final[propName]);
					}
					let etm = attributes.indexOf(top);
					if (etm !== -1) {
						attributes.splice(etm, 1);
					}
					etm = attributes.indexOf(propName);
					if (etm !== -1) {
						attributes.splice(etm, 1);
					}
				}
			});
			attributes.forEach(attribute => {
				if (attribute.indexOf(":") === -1) {
					t.removeAttribute(attribute);
				} else {
					let to = attribute.split(":"), top = to[1], stop = to[0];
					t.removeAttributeNS("http://www.w3.org/1999/" + stop, top, attrs.final[tp]);
				}
			});
		});
		actions.remove.map(action => {
			let t = dom;
			let paths = action.path.split(",");
			let index = paths.pop();
			paths.forEach(path => t = t.childNodes[path / 1]);
			return t.childNodes[index];
		}).forEach(remove => remove.parentNode.removeChild(remove));
		actions.removeAll.forEach(action => {
			let t = dom;
			if (action.path.trim()) {
				action.path.split(",").forEach(path => {
					if (t) {
						t = t.childNodes[path / 1];
					}
				});
			}
			if (t) {
				t.innerHTML = "";
			}
		});
		Reflect.ownKeys(adds).forEach(i => {
			let actions = adds[i];
			if (actions.length > 0) {
				let fm = context.document.createDocumentFragment();
				actions.forEach(action => fm.appendChild(Effecter.element(context, action.n)));
				actions[0].p.appendChild(fm);
			} else {
				actions.p.appendChild(Effecter.element(context, actions.n));
			}
		});
	}
};

class ClassList {
	static getClassName(className, name) {
		if (className) {
			return `${className}-${name}`;
		} else {
			return name;
		}
	}

	constructor(mapDom, className) {
		this._mapDom = mapDom;
		this._className = className;
	}

	add(name) {
		this._mapDom._dom.classList.add(ClassList.getClassName(this._className, name));
		return this;
	}

	remove(name) {
		this._mapDom._dom.classList.remove(ClassList.getClassName(this._className, name));
		return this;
	}

	has(name) {
		return this._mapDom._dom.classList.contains(ClassList.getClassName(this._className, name));
	}

	toggle(name) {
		this._mapDom._dom.classList.toggle(ClassList.getClassName(this._className, name));
		return this;
	}
}

class MapDom {
	static getElementPath(container = null, element = null) {
		let path = [], current = element;
		while (current && current !== container) {
			path.push([...current.parentNode.childNodes].indexOf(current));
			current = current.parentNode;
		}
		return path.reverse();
	}

	constructor(container = null, dom = null, className = "") {
		this._container = container;
		this._dom = dom;
		this.classList = new ClassList(this, className);
	}

	getAttributes() {
		return this._container._cross.getAttributeByPath(MapDom.getElementPath(this._container._container, this._dom));
	}

	getAttribute(propName) {
		return this.getAttributes()[propName];
	}

	getEventInfo() {
		return this._container._cross.getEventsByPath(MapDom.getElementPath(this._container._container, this._dom));
	}

	isListenedEvent(type) {
		return this.getEventInfo()[type] !== undefined;
	}

	element() {
		return this._dom;
	}

	getElement() {
		return this._dom;
	}

	groupi(name = "") {
		return [...this._dom.querySelectorAll(`[data-groupi="${name}"]`)].map(element => new MapDom(this._container, element));
	}
}

class Template {
	constructor(context, template = "", macro = {}, id, option = {}) {
		this._id = id;
		this._currentState = null;
		this._beforeState = null;
		this._macrofn = Object.assign({}, context.ddm.defaultMacros, macro);
		this._templateStr = template;
		this._code = Parser.parse(context, template, option ? option.tags || {} : {});
		this._option = option;
		this._useprops = [];
		this._context = context;
	}

	_macro({tag: methodName, bodyStr, props, events, attrs, uses, usesmap}) {
		if (this._macrofn[methodName]) {
			let useProps = [];
			if (props.parameter) {
				let proxy = props.parameter[PROXYSTATE];
				if (proxy) {
					if (proxy._parent) {
						useProps.push(proxy._prop);
					}
				} else {
					if (Array.isArray(proxy)) {
						proxy.forEach(item => {
							if (item[PROXYSTATE] && item[PROXYSTATE]._parent) {
								useProps.push(item[PROXYSTATE]._prop);
							}
						});
					} else if (isPlainObject(proxy)) {
						Reflect.ownKeys(proxy).forEach(key => {
							let item = proxy[key];
							if (item[PROXYSTATE] && item[PROXYSTATE]._parent) {
								useProps.push(item[PROXYSTATE]._prop);
							}
						});
					}
				}
			}
			uses.map(key => {
				let item = usesmap[key];
				if (item && item[PROXYSTATE] && item[PROXYSTATE]._prop) {
					useProps.push(item[PROXYSTATE]._prop);
				} else {
					let n = key.split("."), m = n.pop(), t = n.join("."), f = usesmap[t];
					if (f && f[PROXYSTATE]) {
						useProps.push(f[PROXYSTATE]._prop + "." + m);
					}
				}
			});
			props.useProps = useProps;
			let result = this._macrofn[methodName]({
				attrs,
				events,
				props,
				bodyStr,
				parseBody: function (values) {
					if (bodyStr !== "") {
						let et = new Template(this._context, bodyStr, this._macrofn, this._id, null, null);
						let nt = et.render(values);
						return nt;
					} else {
						return "";
					}
				}.bind(this),
				context: this,
				id: this._id,
				option: this._option,
				env: this._context
			});
			if (result && result.template) {
				let _result = new Template(this._context, result.template, this._macrofn, this._id, null, null);
				let states = _result.getCurrentState(result.data);
				if (states.length === 1) {
					let _out = states[0];
					let _events = Reflect.ownKeys(events);
					if (_events.length > 0) {
						_out.attrs["data-bind"] = `${this._id}:${_events.map(key => key).join(",")}`;
					}
					Object.assign(_out.props, props);
					Object.assign(_out.events, events);
					Object.assign(_out.attrs, attrs);
					return [_out];
				} else {
					throw new Error("[ada] macro must return only one node");
				}
			} else {
				return result || "";
			}
		} else {
			console.error("[ada] macro can not found [" + methodName + "] template is " + this._templateStr);
			return "";
		}
	}

	getAttributeByPath(path = []) {
		let node = {children: this._currentState};
		path.forEach((p) => node = node.children[p]);
		return node.props || null;
	}

	getEventsByPath(path = []) {
		let node = {children: this._currentState};
		path.forEach((p) => node = node.children[p]);
		return node.events || null;
	}

	getAllInfoByPath(path = []) {
		let node = {children: this._currentState};
		path.forEach((p) => node = node.children[p]);
		return {events: node.events, props: node.props};
	}

	getCurrentEventMap() {
		if (this._currentState) {
			return Differ.childrenEvents(this._currentState);
		} else {
			return {
				bubbleEvents: [],
				unBubbleEvents: {}
			};
		}
	}

	getCurrentState(data) {
		let paras = [IDNAME, "data", ...this._context.ddm.defaultFunctionNames, this._code];
		let _paras = [this._id, data, ...this._context.ddm.defaultFunctionFns];
		return new Function(...paras).call(this, ..._paras);
	}

	render(data = {}, isdiff = true) {
		if (this._currentState) {
			this._beforeState = this._currentState;
		}
		let collector = new Collector({data, fn: this.getCurrentState, freeze: false});
		this._currentState = collector.invoke({}, this);
		this._useprops = collector.getUsedPros();
		if (isdiff) {
			if (this._beforeState) {
				return Differ.diff(this._currentState, this._beforeState);
			} else {
				return Parser.getHTMLString(this._context, this._currentState);
			}
		} else {
			return Parser.getHTMLString(this._context, this._currentState);
		}
	}

	renderStatic(data = {}, isdiff = true) {
		if (this._currentState) {
			this._beforeState = this._currentState;
		}
		let collector = new Collector({data, fn: this.getCurrentState, freeze: false});
		this._currentState = collector.invoke({}, this);
		this._useprops = collector.getUsedPros();
		if (isdiff) {
			if (!this._beforeState) {
				return Parser.getHTMLString(this._context, this._currentState);
			} else {
				return null;
			}
		} else {
			return Parser.getHTMLString(this._context, this._currentState);
		}
	}

	isRendered() {
		return !this._templateStr || this._beforeState != null;
	}
}

class DDM {
	constructor({id, container = null, templateStr = "", binders = {}, macro = {}, option = {}, context = null, className}) {
		this._context = context;
		this._id = id;
		this._container = container;
		this._cross = new Template(context, templateStr, macro, id, option);
		this._binders = binders;
		this._isrender = false;
		this._className = className || "";
	}

	_agentEvent({bubbleEvents, unBubbleEvents}) {
		let dom = this._container;
		eventHelper.unbind(dom);
		bubbleEvents.forEach(eventType => {
			eventHelper.bind(dom, eventType, e => {
				let target = e.target, eventType = e.type;
				let current = target, targets = [];
				while (current && current !== this._container && current !== this._context.document) {
					let bindTypesStr = current.dataset["bind"];
					if (bindTypesStr) {
						let _a = bindTypesStr.split(":");
						let hash = _a[0], types = _a[1] ? _a[1].split(",") : [];
						if (hash === this.getId() && types.indexOf(eventType) !== -1) {
							let {events, props} = this._cross.getAllInfoByPath(MapDom.getElementPath(this._container, current));
							let _info = events[e.type];
							if (_info) {
								targets.push({info: _info, props});
							}
						}
					}
					current = current.parentNode;
				}
				targets.forEach(({info, props}) => {
					let {method, parameters, paranames} = info;
					if (this._binders) {
						let pars = {e, props};
						paranames.split(",").forEach((key, i) => pars[key] = parameters[i]);
						this._binders({method, parameters: pars});
					}
				});
			});
		});
		Reflect.ownKeys(unBubbleEvents).forEach((name) => {
			[...dom.querySelectorAll('[data-bind="' + name + '"]')].forEach(element => {
				unBubbleEvents[name].forEach(type => {
					eventHelper.unbind(element, type);
					eventHelper.bind(element, type, e => {
						let target = e.target, eventType = e.type;
						let bindTypesStr = target.dataset["bind"];
						if (bindTypesStr) {
							let _a = bindTypesStr.split(":");
							let hash = _a[0], types = _a[1] ? _a[1].split(",") : [];
							if (hash === this.getId() && types.indexOf(eventType) !== -1) {
								let {events, props} = this._cross.getAllInfoByPath(MapDom.getElementPath(this._container, target));
								let _info = events[e.type];
								if (_info) {
									let {method, parameters, paranames} = _info;
									if (this._binders) {
										let pars = {e, props};
										paranames.split(",").forEach((key, i) => pars[key] = parameters[i]);
										this._binders({method: _info.method, parameters: pars});
									}
								}
							}
						}
					});
				});
			});
		});
	}

	getId() {
		return this._id;
	}

	finder(name) {
		return this.finders(name)[0];
	}

	finders(name) {
		let _id = `${this._id}:${name}`;
		let querystr = `[data-find="${_id}"]`;
		return [...this._container.querySelectorAll(querystr)].map(element => new MapDom(this, element, this._className));
	}

	group(name) {
		return this.groups(name);
	}

	groups(name) {
		let _id = `${this._id}:${name}`;
		let querystr = `[data-group="${_id}"]`;
		return [...this._container.querySelectorAll(querystr)].map(element => new MapDom(this, element));
	}

	modules() {
		let querystr = `[data-module="${this._id}"]`;
		return [...this._container.querySelectorAll(querystr)].map(element => new MapDom(this, element));
	}

	render(data, isdiff = true) {
		let result = this._cross.render(data, isdiff);
		if (isdiff) {
			if (!this._cross.isRendered()) {
				if (result) {
					(!this._container.innerHTML) && (this._container.innerHTML = result);
				}
			} else {
				if (result) {
					Effecter.effect(this._context, this._container, result);
				}
			}
		} else {
			if (result) {
				(!this._container.innerHTML) && (this._container.innerHTML = result);
			}
		}
		this._agentEvent(this._cross.getCurrentEventMap());
		this._isrender = true;
		return this;
	}

	renderStatic(data, isdiff = true) {
		let result = this._cross.renderStatic(data, isdiff);
		if (isdiff) {
			if (!this._cross.isRendered()) {
				if (result) {
					(!this._container.innerHTML) && (this._container.innerHTML = result);
				}
			}
		} else {
			if (result) {
				(!this._container.innerHTML) && (this._container.innerHTML = result);
			}
		}
		this._agentEvent(this._cross.getCurrentEventMap());
		this._isrender = true;
		return this;
	}

	getUseProps(withDom = false) {
		return this._cross._useprops
	}

	getDOMUseProps() {
		let moduleUseProps = [];
		this.modules().filter(module => {
			return !module.getElement()[VIEWTAG].isRemoved()
		}).forEach(module => {
			moduleUseProps = moduleUseProps.concat(module.getElement()[VIEWTAG]._getParentUseProps());
		});
		let k = this._cross._useprops.join("|");
		moduleUseProps.forEach(prop => {
			k = k.replace(prop, "");
		});
		let r = k.split("|").filter(a => a !== "");
		return r;
	}

	isRendered() {
		return this._isrender;
	}
}

module.exports = {Parser, DDM, MapDom};