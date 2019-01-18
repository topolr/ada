let ExtendModule = require("./base");

let updater = {
	refresh(context, files, map) {
		return new ExtendModule(context).replaceAll(files, map);
	}
};

module.exports = updater;