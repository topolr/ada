let {DATASET, DATASETSERVICE} = require("./const");
let Passable = require("../passable");
let env = require("./../env");

const QUREYREG = /(^|&).*=([^&]*)(&|$)/;
const TEMPLATEREG = /class=(["'])(?:(?=(\\?))\2.)*?\1/g;
const STYLEREG = /\{|\}/;
const STYLEREG_B = /\.[0-9a-zA-Z-]+/g;
const ISHTMLREG = /^\s*<(\w+|!)[^>]*>/;

function isString(obj) {
	return (typeof obj === 'string') && obj.constructor === String;
}

function isFunction(obj) {
	return (typeof obj === 'function') && obj.constructor === Function;
}

function isEqual(one, two) {
	if (one === null || one === undefined || two === null || two === undefined) {
		return one === two;
	}
	if (one.constructor !== two.constructor) {
		return false;
	}
	if (one instanceof Function) {
		return one === two;
	}
	if (one instanceof RegExp) {
		return one === two;
	}
	if (one === two || one.valueOf() === two.valueOf()) {
		return true;
	}
	if (Array.isArray(one) && one.length !== two.length) {
		return false;
	}
	if (one instanceof Date) {
		return false;
	}
	if (!(one instanceof Object)) {
		return false;
	}
	if (!(two instanceof Object)) {
		return false;
	}
	let p = Object.keys(one);
	return Object.keys(two).every(function (i) {
		return p.indexOf(i) !== -1;
	}) && p.every(function (i) {
		return isEqual(one[i], two[i]);
	});
}

function isObject(obj) {
	return typeof (obj) === "object" && Object.prototype.toString.call(obj).toLowerCase() === "[object object]" && !obj.length;
}

function isPlainObject(obj) {
	return isObject(obj) && obj.constructor.prototype === Object.prototype;
}

function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

function isQueryString(str) {
	return isString(str) && QUREYREG.test(str);
}

function queue(arr) {
	let current = null, result = [];
	arr.forEach(task => {
		if (!current) {
			current = task();
		} else {
			current = current.then(info => {
				result.push(info);
				return task();
			});
		}
	});
	return current ? current.then((info) => {
		result.push(info);
		return result;
	}) : Promise.resolve([]);
}

function randomid(len = 7) {
	if (len <= 2) {
		len = 7;
	}
	return Math.random().toString(36).slice(2, len + 2);
}

function setProp(target, key, value) {
	Reflect.defineProperty(target, key, {
		enumerable: false,
		configurable: false,
		writable: true,
		value: value
	});
}

function queryString(obj) {
	let result = [];
	if (obj) {
		for (let i in obj) {
			let val = obj[i];
			if (isString(val)) {
				result.push(`${i}=${encodeURIComponent(val)}`);
			} else if (isObject(val) || isArray(val)) {
				result.push(`${i}=${encodeURIComponent(JSON.stringify(val))}`);
			} else {
				result.push(`${i}=${(val !== undefined && val !== null ? encodeURIComponent(val.toString()) : "")}`);
			}
		}
		return result.join("&");
	} else {
		return "";
	}
}

function postData(obj, encodeurl) {
	if (obj) {
		if (obj instanceof FormData || obj instanceof Blob || obj instanceof ArrayBuffer) {
			return obj;
		} else if (isObject(obj)) {
			let has = false;
			for (let i in obj) {
				if (obj[i] instanceof Blob || obj[i] instanceof ArrayBuffer || obj[i] instanceof File) {
					has = true;
					break;
				}
			}
			if (has) {
				let fd = new FormData();
				for (let i in obj) {
					if (obj[i] instanceof Blob) {
						fd.append(i, obj[i]);
					} else if (obj[i] instanceof File) {
						fd.append(i, obj[i]);
					} else if (isArray(obj[i]) || isObject(obj[i])) {
						fd.append(i, encodeURIComponent(JSON.stringify(obj[i])));
					} else if (obj[i] instanceof FormData) {
					} else {
						fd.append(i, encodeURIComponent(obj[i].toString()));
					}
				}
				return fd;
			} else {
				if (encodeurl) {
					return queryString(obj);
				} else {
					return JSON.stringify(obj);
				}
			}
		} else if (isArray(obj)) {
			return encodeURIComponent(JSON.stringify(obj));
		} else {
			return obj;
		}
	} else {
		return null;
	}
}

function parseTemplate(code, className) {
	if (className) {
		return code.replace(TEMPLATEREG, function (str) {
			if (str.indexOf("{{") === -1) {
				let val = str.substring(7, str.length - 1).trim();
				let r = val.split(" ").map(k => {
					if (k[0] === ":") {
						return k.substring(1);
					} else {
						return className + "-" + k;
					}
				});
				let dot = str.substr(6, 1);
				return `class=${dot}${r.join(" ")}${dot}`;
			} else {
				let val = str.substring(9, str.length - 3).trim();
				return `class="{{(${val}).split(' ').map(key=>key?(key[0]!==':'?('${className}-'+key):key.substring(1)):'').join(' ')}}"`;
			}
		});
	} else {
		return code;
	}
}

function parseStyle(code, className) {
	let str = "", _r = [], _t = [];
	code.split(STYLEREG).forEach(_a => {
		let _b = _a.trim();
		if (_b.indexOf("@") !== -1) {
			_t.push([].concat(_r));
			_r = [];
		}
		_r.push(_b);
	});
	_t.push(_r);
	_t.forEach(_a => {
		let _has = false, r = [];
		if (_a[0].indexOf("@") !== -1) {
			_has = true;
			str += _a[0] + "{";
			_a.shift();
		}
		_a.forEach((_b, i) => {
			_b = _b.trim();
			if ((i + 1) % 2 !== 0) {
				r.push(_b.replace(STYLEREG_B, (str) => {
					if (str.substring(1).trim() !== className) {
						return `.${className}-${str.substring(1)}`;
					} else {
						return str;
					}
				}));
			} else {
				_b && r.push("{" + _b + "}");
			}
		});
		if (_has) {
			str += r.join("") + "}"
		} else {
			str += r.join("");
		}
	});
	return str;
}

function excuteStyle(code, path, context) {
	if (!context.document.getElementById(path)) {
		let _a = context.document.createElement("style");
		_a.setAttribute("media", "screen");
		_a.setAttribute("type", "text/css");
		_a.setAttribute("id", path);
		_a.appendChild(context.document.createTextNode(code));
		context.document.getElementsByTagName("head")[0].appendChild(_a);
	}
}

function hashCode(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		var character = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + character;
		hash = hash & hash;
	}
	return hash;
}

function encodeHTML(str, context) {
	if (ISHTMLREG.test(str)) {
		let temp = context.document.createElement("div");
		(temp.textContent != undefined) ? (temp.textContent = str) : (temp.innerText = str);
		return temp.innerHTML;
	} else {
		return str;
	}
}

function getMappedPath(path) {
	return `P${Math.abs(hashCode(path))}`;
}

function extend() {
	let options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;
	if (typeof target === "boolean") {
		deep = target;
		target = arguments[i] || {};
		i++;
	}
	if (typeof target !== "object" && !isFunction(target)) {
		target = {};
	}
	if (i === length) {
		target = this;
		i--;
	}
	for (; i < length; i++) {
		if ((options = arguments[i]) != null) {
			for (name in options) {
				src = target[name];
				copy = options[name];
				if (target === copy) {
					continue;
				}
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}
					target[name] = extend(deep, clone, copy);
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}
	return target;
}

function clone(data) {
	if (isArray(data)) {
		return extend(true, [], data);
	} else if (isObject(data)) {
		return extend(true, {}, data);
	} else {
		return data;
	}
}

function isTargetDataSet(_dataset, info) {
	let _istarget = true;
	if (!(_dataset[DATASETSERVICE] instanceof info.service)) {
		_istarget = false;
	}
	if (_istarget && info.type) {
		if (!(_dataset instanceof info.type)) {
			_istarget = false;
		}
	}
	return _istarget;
}

function getDataSetFromParent(_view, info) {
	let result = null, _current = _view.getParent();
	while (_current) {
		let _dataset = _current[DATASET];
		if (_dataset) {
			if (isTargetDataSet(_dataset, info)) {
				result = _dataset;
				break;
			}
		}
		_current = _current.getParent();
	}
	return result;
}

function isSubModuleChange(changeprops, useprops) {
	if (changeprops && useprops && changeprops.length > 0 && useprops.length > 0) {
		return useprops.some(item => {
			return changeprops.some(_changed => {
				return (item.indexOf(_changed) === 0 || _changed.indexOf(item) === 0 || _changed === item);
			});
		});
	} else {
		return !(changeprops.length === 0 || useprops.length === 0);
	}
}

function protectData(data) {
	let result = data;
	if (!Object.isFrozen(data) && env.develop) {
		result = Passable.get(data).pass();
	}
	return result;
}

function isBrowser() {
	return typeof window !== "undefined";
}

module.exports = {
	isString,
	isFunction,
	isEqual,
	isObject,
	isPlainObject,
	isArray,
	isQueryString,
	queue,
	randomid,
	setProp,
	queryString,
	postData,
	parseTemplate,
	parseStyle,
	hashCode,
	encodeHTML,
	getMappedPath,
	extend,
	clone,
	excuteStyle,
	isTargetDataSet,
	getDataSetFromParent,
	isSubModuleChange,
	protectData,
	isBrowser
};