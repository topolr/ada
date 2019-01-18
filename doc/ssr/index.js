let {DistRenderer} = require("adajs/server");
let Path = require("path");
let {File} = require("ada-util");

const distPath = Path.resolve(__dirname, "./../../dist");

console.log('[SSR] START TO PUBLISH PROJECT');
let publish = require('child_process').spawn(Path.resolve(__dirname, "./../../node_modules/.bin/ada-pack"), ["publish"], {
	cwd: Path.resolve(__dirname, "./../../"),
	stdio: ['inherit', 'inherit', 'inherit', 'ipc']
});
publish.on('exit', () => {
	console.log('[SSR] PUBLISH PROJECT DONE,START SERVER');
	let server = require('child_process').spawn(Path.resolve(__dirname, "./../../node_modules/.bin/ada-pack"), ["process"], {
		cwd: Path.resolve(__dirname, "./../../"),
		stdio: ['inherit', 'inherit', 'inherit', 'ipc']
	});
	server.on("message", a => {
		if (a.type === 'done') {
			console.log('[SSR] SERVER STARTED,START SSR');
			let renderer = new DistRenderer({
				origin: "http://localhost:8080",
				distPath
			});
			let startTime = new Date().getTime();
			renderer.outputURLs(require("./../../app/src/menu").map(item => item.link)).then(results => {
				Reflect.ownKeys(results).reduce((a, path) => {
					return a.then(() => new File(Path.resolve(distPath, `.${path === '/' ? '/index.html' : path}`)).write(results[path]));
				}, Promise.resolve());
			}).then(() => {
				console.log(`[SSR] ALL DONE IN ${new Date().getTime() - startTime}ms`);
				server.kill();
			});
		}
	});
	server.on('close', () => {
		console.log(`[SSR] SERVER HAS STOPPED`);
	});
});