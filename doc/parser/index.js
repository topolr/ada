let marked = require("marked");
let Path = require("path");
let { File } = require("ada-util");
let hash = require("ada-util/src/md5");
let minify = require('html-minifier').minify;

function parse(content) {
	return new Promise((resolve, reject) => {
		marked.setOptions({
			renderer: new marked.Renderer(),
			gfm: true,
			tables: true,
			breaks: false,
			pedantic: false,
			sanitize: false,
			smartLists: true,
			smartypants: false
		});
		marked(content, function (err, r) {
			if (err) {
				reject(err);
			} else {
				resolve(minify(r, {
					removeComments: true,
					collapseWhitespace: true,
					minifyJS: true,
					minifyCSS: true
				}));
			}
		});
	});
}

function getFilesInfo(path) {
	return new File(path).getAllSubFilePaths().then(paths => {
		return Promise.all(paths.filter(fpath => {
			return new File(fpath).suffix === ".md";
		}).map(fpath => {
			fpath = fpath.replace(/\\/g, "/");
			let content = new File(fpath).transform().read();
			let info = null;
			content = content.replace(/<\!--[\s\S]+-->/g, str => {
				let r = str.substring(4, str.length - 3);
				info = JSON.parse(r);
				return "";
			});
			return parse(content).then(_content => {
				let a = fpath.split(".");
				a.pop();
				a.push(".html");
				return {
					link: fpath.substring(path.length + 1).replace(/\.md/g, ".html"),
					name: info.name,
					content: _content,
					hash: hash.md5(_content).substring(0, 8),
					index: info.index,
					commentId: info.commentId,
					info
				}
			});
		}));
	});
}

function output({ path, outpath, distpatch }) {
	return getFilesInfo(path).then(info => {
		let pathInfo = {};
		info.forEach(_info => {
			pathInfo[_info.name] = _info;
		});
		info.forEach(_info => {
			let _path = _info.name;
			let a = _path.split("/");
			if (a.length > 1) {
				let b = a.shift();
				if (!pathInfo[`${b}.html`].list) {
					pathInfo[`${b}.html`].list = [];
				}
				pathInfo[`${b}.html`].list.push({
					name: _info.name,
					hash: _info.hash,
					link: `/${_info.link}`,
					filename: _info.link,
					title: _info.info.title,
					icon: _info.info.icon || "",
					photo: _info.info.photo,
					desc: _info.info.desc,
					index: _info.index,
					active: false,
					commentId: _info.commentId,
					list: []
				});
			}
		});
		let result = [], tasks = [];
		Reflect.ownKeys(pathInfo).forEach(key => {
			let value = pathInfo[key];
			if (value.link === "index.html") {
				result.unshift({
					name: value.name,
					hash: value.hash,
					link: "/",
					filename: value.link || "index.html",
					title: value.info.title,
					icon: value.info.icon || "",
					photo: value.info.photo,
					desc: value.info.desc,
					index: value.index,
					commentId: value.commentId,
					list: value.list || []
				});
			} else {
				result.push({
					name: value.name,
					hash: value.hash,
					filename: value.link,
					link: `/${value.link}`,
					title: value.info.title,
					icon: value.info.icon || "",
					photo: value.info.photo,
					desc: value.info.desc,
					index: value.index,
					commentId: value.commentId,
					list: value.list || []
				});
			}
			tasks.push({
				path: Path.resolve(outpath, value.link),
				content: value.content
			});
		});
		return tasks.reduce((a, task) => {
			return a.then(() => {
				return new File(task.path).write(task.content);
			});
		}, Promise.resolve()).then(() => {
			let _result = [];
			result.forEach((info, index) => {
				_result[info.index] = info;
			});
			return _result;
		}).then((result) => {
			let tasks = [];
			result.forEach(item => {
				if (item.list.length > 0) {
					let mt = {};
					item.list.forEach(_item => {
						let time = new Date(_item.time + " 0:0:0").getTime();
						mt[`${time}`] = _item;
					});
					let content = `<div class="content-list">`;
					content += Reflect.ownKeys(mt).reverse().map(key => {
						let sub = mt[key];
						return `<div class="content-item"><div class="content-item-title"><a href="${sub.name}">${sub.label}</a></div><div class="content-item-cover" style="background-image:url(${sub.photo})"></div><div class="content-item-desc">${sub.desc}</div><div class="content-item-time">${sub.time}</div></div>`;
					}).join("");
					content += `</div>`;
					item.hash = hash.md5(content).substring(0, 8);
					tasks.push({
						path: item.name,
						content
					});
				}
			});
			return new File(Path.resolve(distpatch, "./menu.json")).write(JSON.stringify(result)).then(() => {
				return new File(Path.resolve(__dirname, "./../../app/src/", "menu.json")).write(JSON.stringify(result))
			}).then(() => {
				return new File(Path.resolve(path, "./images")).getAllSubFilePaths().then(files => {
					return files.reduce((a, file) => {
						return a.then(() => {
							return new File(file).copyTo(Path.resolve(outpath, "./images/", Path.basename(file)));
						});
					}, Promise.resolve());
				});
			});
		});
	});
}

module.exports = {
	output() {
		console.log("[PARSE DOCS]");
		return output({
			path: Path.resolve(__dirname, "./../"),
			outpath: Path.resolve(__dirname, "./../../dist/docs"),
			distpatch: Path.resolve(__dirname, "./../../dist")
		}).catch(e => console.log(e));
	},
	outputPage() {
		console.log("[COPY FILES]");
		let distpatch = Path.resolve(__dirname, "./../../dist");
		return ["CNAME", "LICENSE", "readme.md"].reduce((a, name) => {
			return a.then(() => {
				return new File(Path.resolve(__dirname, `./../../${name}`)).copyTo(Path.resolve(distpatch, `./${name}`));
			});
		}, Promise.resolve());
	}
};