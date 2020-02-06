let { Parser } = require("./../../base/ddm");

class DDMVariables {
    constructor() {
        this._defaultMacros = {
            self({ props, context }) {
                return { template: context.getTemplateStr(), data: props.parameter };
            },
            custom({ bodyStr, props, events, attrs, option, env }) {
                let template = "";
                let tagName = props.customTagName, generator = option ? (option.tags ? option.tags[tagName] : null) : null;
                if (!generator) {
                    generator = env.tags.get(tagName);
                }
                if (generator.template) {
                    template = generator.template({
                        bodyStr,
                        props,
                        events,
                        attrs,
                        option,
                        generateOption: generator.option
                    });
                } else {
                    throw Error(`[ada] tag [${tagName}] can not defined with function of generate template`);
                }
                return { template, data: props };
            }
        };
        this._defaultAssignDirectives = {
            html(content) {
                return content;
            }
        };
        this._defaultFunctionNames = ["join"];
        this._defaultFunctionFns = [(...args) => {
            return args
                .filter(a => typeof a === 'string')
                .map(a => a.trim())
                .filter(a => a !== '')
                .join(' ');
        }];
    }

    get defaultMacros() {
        return this._defaultMacros;
    }

    get defaultAssignDirectives() {
        return this._defaultAssignDirectives
    }

    get defaultFunctionNames() {
        return this._defaultFunctionNames;
    }

    get defaultFunctionFns() {
        return this._defaultFunctionFns;
    }

    setDefaultMacro(key, fn) {
        this._defaultMacros[key] = fn;
        return null;
    }

    setDefaultAssignDirective(key, fn) {
        this._defaultAssignDirectives[key] = fn;
        (function (key) {
            Parser.beautySyntax.syntaxs[key] = function (str) {
                return `<%=assign(${key},${str.filter(a => !!a).join(",")});%>`;
            };
        })(key);
        return null;
    }

    setDefaultFunctions(name, fn) {
        let index = this._defaultFunctionNames.indexOf(name);
        if (index === -1) {
            this._defaultFunctionNames.push(name);
            this._defaultFunctionFns.push(fn);
        } else {
            this._defaultFunctionFns[index] = fn;
        }
    }
}

module.exports = DDMVariables;