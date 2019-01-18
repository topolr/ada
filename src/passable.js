let Collector = require("./base/collector");
let {BASEDATA} = require("./util/const");

class Passable {
	constructor(data) {
		Reflect.defineProperty(this, BASEDATA, {
			enumerable: false,
			configurable: false,
			writable: true,
			value: data
		});
	}

	pass(fn, parameter = {}, scope = {}) {
		if (!fn) {
			fn = (info) => info;
		}
		let collector = new Collector({data: this[BASEDATA], fn, collect: false});
		return collector.invoke(parameter, scope);
	}

	static get(data) {
		return new Passable(data);
	}
}

module.exports = Passable;