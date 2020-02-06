let ExtendModule = require("./base");

class Queue {
	constructor() {
		this._list = [];
		this._run = false;
	}

	add(fn) {
		return new Promise(resolve => {
			this._list.push({ resolve, fn });
			this._trigger();
		});
	}

	_trigger() {
		if (!this._run) {
			if (this._list.length > 0) {
				this._run = true;
				let { resolve, fn } = this._list.shift();
				Promise.resolve().then(() => fn()).then(a => {
					this._run = false;
					resolve(a);
					this._trigger();
				}, e => {
					console.log('queue emit error:', e);
					this._run = false;
					resolve(e);
					this._trigger();
				});
			} else {
				this._run = false;
			}
		}
	}
}

let updater = {
	queue: new Queue(),
	refresh(context, files, map) {
		return this.queue.add(() => {
			return new ExtendModule(context).replaceAll(files, map);
		});
	}
};

module.exports = updater;