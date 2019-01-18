let util = require("../base/util");

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
    prop: /[0-9a-z]+((\.)([0-9a-z_]+))+/g
};
const SINGLETAG = ["br", "hr", "img", "input", "param", "link", "meta", "area", "base", "basefont", "param", "col", "frame", "embed", "keygen", "source"];
const TEMPLATECACHE = new Map();
const IDNAME = "$$ID";

let Parser = {
    beautySyntax: {
        syntaxs: {
            defaults(str) {
                return `<%=${str.substring(2, str.length - 2)};%>`;
            },
            log(str) {
                return `<%console.log(${str.join(" ")});%>`;
            },
            html(str) {
                return `<%=assign(html,${str});%>`;
            },
            map(a) {
                let dataname = a.shift();
                a.shift();
                let keyname = a.shift() || "$value",
                    indexname = a.shift() || "$key",
                    iname = "_" + util.randomid(8);
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
                    iname = "_" + util.randomid(8),
                    lenname = "_" + util.randomid(6);
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
    getHTMLString(nodes) {
        let str = "";

        function html(node) {
            let result = "", issingletag = SINGLETAG.indexOf(node.tag) !== -1;
            if (node.content !== undefined) {
                if (node.type === undefined) {
                    result = util.encodeHTML(node.content) || "";
                } else {
                    let _adtype = node.type;
                    let _code = node.content;
                    if (DefaultAssignDirectives[_adtype]) {
                        _code = DefaultAssignDirectives[_adtype](node.content);
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
        }

        nodes.forEach(function (node) {
            str += html(node);
        });
        return str;
    },
    preparse(str = "") {
        str = str.trim()
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
        SINGLETAG.forEach((tag) => {
            let reg = new RegExp(`<${tag} .*?>`, "g");
            str = str.replace(reg, function (a) {
                return a.substring(0, a.length - 1) + "/>";
            });
        });
        return str;
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
                let _event = [], _props = [], _attrs = [], _useprops = [];
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
                                    let e = p.split(".");
                                    e.pop();
                                    _useprops.push(`"${p}":${p}`);
                                    _useprops.push(`"${e.join(".")}":${e.join(".")}`);
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
                vt += `${str.substring(startin, item.from)}
                       <%var $$MACRORESULT=this._macro({tag:"${item.tagname}",props:{${_props.join(",")}},attrs:{${_attrs.join(",")}},events:{${_event_.join(",")}},bodyStr:"${item.bodystr}",uses:{${_useprops.join(",")}}});if($$MACRORESULT&&$$MACRORESULT.length){for(var $$INDEX=0;$$INDEX<$$MACRORESULT.length;$$INDEX++){{{node}}.children.push($$MACRORESULT[$$INDEX]);}}else{{{node}}.children.push({content:$$MACRORESULT||''});}%>`;
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
        Parser.parseNode(fn).forEach((item, i) => {
            let pt = i + "_0";
            let ct = Parser.nodeParser.code(item, pt);
            t += ct + "\r\n";
            if (ct.indexOf("$$NODE" + pt) !== -1 && ct.indexOf("$$RESULT.push($$NODE" + pt + ")") === -1) {
                t += "$$RESULT.push($$NODE" + pt + ");\r\n";
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
    parse(temp = "") {
        let result = "";
        if (!TEMPLATECACHE.has(temp)) {
            result = Parser.code(Parser.parseMacro(Parser.beautySyntax.parse(Parser.preparse(temp))));
            TEMPLATECACHE.set(temp, result);
        } else {
            result = TEMPLATECACHE.get(temp);
        }
        return result;
    }
};

module.exports = Parser;