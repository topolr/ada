let child_process = require('child_process');
let {randomid} = require("../src/util/helper");

let Task = {};

class Worker {
	constructor({url, distPath}) {
		let child = child_process.fork(require("path").resolve(__dirname, './worker.js'), [], {
			encoding: 'utf8'
		});
		child.on('message', ({id, data}) => {
			if (Task[id]) {
				Task[id](data);
				delete Task[id];
			}
		});
		this._worker = child;
		this._distPath = distPath;
		this._url = url;
	}

	render(url) {
		return new Promise((resolve) => {
			let id = randomid();
			this._worker.send({
				type: "render", id, data: {
					url, distPath: this._distPath, origin: this._url
				}
			});
			Task[id] = resolve;
		});
	}

	renderc(url) {
		return new Promise((resolve) => {
			let id = randomid();
			this._worker.send({
				type: "renderc", id, data: {
					url, distPath: this._distPath, origin: this._url
				}
			});
			Task[id] = resolve;
		});
	}

	kill() {
		this._worker.kill();
	}
}

module.exports = {
	getWorker(distPath) {
		return new Worker(distPath);
	}
};