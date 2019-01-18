let util = require("../base/util");
let ora = require("ora");
let {SyncFile,File} = require("ada-util");
let Path = require("path");
let Parser = require("../lib/parser");

module.exports = {
    command: "gtcss",
    desc: "generate sass code from template file",
    paras: ["path", "name", "output"],
    fn: function (parameters) {
        let currentPath = process.cwd();
        let path = parameters[0] || "./", name = parameters[1], output = parameters[2];
        if (new SyncFile(Path.resolve(currentPath, path)).isFolder()) {
            output = Path.resolve(currentPath, path, name, "./style.scss");
            path = Path.resolve(currentPath, path, name, "./template.html");
        }
        let content = new SyncFile(Path.resolve(currentPath, path)).read();
        let result = Parser.parseNode(content);
        let getClass = (array) => {
            return array.filter(item => item.props !== undefined).map(item => {
                return {
                    class: item.props.class || "un",
                    subs: item.children ? getClass(item.children) : []
                }
            });
        };
        let generateCode = (list) => {
            let code = ``;
            list.forEach(item => {
                let init = [];
                if (item.class.startsWith("{{")) {
                    let k = item.class.match(/['"][\s\S]+?['"]/g);
                    let main = "", subs = [];
                    if (k) {
                        let et = k.map(item => {
                            return item.substring(1, item.length - 1).split(" ");
                        });
                        let ep = et.shift();
                        ep.forEach(item => {
                            let q = et.filter(_et => _et.indexOf(item) !== -1);
                            if (q.length === et.length) {
                                main = item;
                            }
                        });
                        let n = new Set();
                        et.push(ep);
                        et.forEach(a => {
                            a.forEach(b => n.add(b));
                        });
                        init = [...n].filter(a => a !== main);
                        code += `.${main}{`;
                    }
                } else {
                    code += `.${item.class}{`;
                }
                code += `${generateCode(item.subs)}`;
                if (init.length > 0) {
                    init.forEach(a => {
                        code += `&.${a}{}`;
                    });
                }
                code += `}`;
            });
            return code;
        };
        let code = `.${name}{${generateCode(getClass(result))}}`;
        new File(output).write(code);
    }
};