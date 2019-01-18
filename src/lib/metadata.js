const METADATAKEY = "[[metadata]]";

const Metadata = {
	defineMetadata(metadataKey, metadataValue, target) {
		if (Reflect.ownKeys(target).indexOf(METADATAKEY) === -1) {
			Reflect.defineProperty(target, METADATAKEY, {
				enumerable: false,
				configurable: false,
				writable: false,
				value: {}
			});
		}
		target[METADATAKEY][metadataKey] = metadataValue;
	},
	getMetadata(metadataKey, target) {
		let current = target, result = undefined;
		while (current) {
			if (Reflect.ownKeys(current).indexOf(METADATAKEY) !== -1) {
				result = current[METADATAKEY][metadataKey];
				break;
			}
			current = Reflect.getPrototypeOf(current);
		}
		return result;
	},
	getMetadataExtends(metadataKey, target) {
		let current = target, result = [];
		while (current) {
			if (Reflect.ownKeys(current).indexOf(METADATAKEY) !== -1) {
				result.push(current[METADATAKEY][metadataKey]);
			}
			current = Reflect.getPrototypeOf(current);
		}
		return Object.assign({}, ...result.reverse());
	}
};

module.exports = Metadata;