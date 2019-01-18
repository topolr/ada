let {isObject, isFunction} = require("./util/helper");
let Metadata = require("./lib/metadata");
let {DataSet, Service} = require("./dataset");
let {setSourcePaths} = require("./context/util");

function checkDataSetMetaInfo(type) {
	if (isFunction(type)) {
		type = {service: type};
	}
	let checked = true, errorInfo = "", _info = Object.assign({
		type: DataSet,
		service: null
	}, type);
	if (!(isFunction(_info.type) && (_info.type.prototype instanceof DataSet) || _info.type === DataSet)) {
		checked = false;
		errorInfo = "[ada] dataset must be a class or subclass of  DataSet";
	}
	if (!(isFunction(_info.service) && (_info.service.prototype instanceof Service || _info.service === Service))) {
		checked = false;
		errorInfo = "[ada] service must be a class or subclass of  Service";
	}
	return {checked, errorInfo, info: _info};
}

function setViewAnnotation(tag, info) {
	if (info === null || isObject(info)) {
		return function (target) {
			let _info = info || {};
			if (_info.dataset) {
				let {checked, errorInfo, info} = checkDataSetMetaInfo(_info.dataset);
				if (checked) {
					_info.dataset = info;
				} else {
					throw Error(`[data] view dataset error ${errorInfo}`);
				}
			}
			setSourcePaths(_info);
			Metadata.defineMetadata(tag, _info, target.prototype);
		}
	} else {
		Metadata.defineMetadata(tag, {}, info.prototype);
	}
}

function setMethodAnnotation(tag, name) {
	if (name) {
		return function (target, methodName) {
			let info = Metadata.getMetadata(tag, target) || {};
			name.split(",").forEach(key => info[key] = methodName);
			Metadata.defineMetadata(tag, info, target);
		}
	} else {
		throw Error(`[ada] annotation ${name} name can not be empty`);
	}
}

exports.view = function (info = null) {
	return setViewAnnotation("view", info);
};

exports.root = function (info = null) {
	return setViewAnnotation("root", info);
};

exports.action = function (name) {
	return setMethodAnnotation("action", name);
};

exports.compute = function (name) {
	return setMethodAnnotation("compute", name);
};

exports.handler = function (name) {
	return setMethodAnnotation("handler", name);
};

exports.binder = function (name) {
	return setMethodAnnotation("binder", name);
};

exports.subscribe = function (name) {
	return setMethodAnnotation("subscribe", name);
};