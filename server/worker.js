let {DistRenderer} = require("./index");

let Renderer = {};

let Tasks = {
	render({url, distPath, origin}) {
		return new DistRenderer({url: origin, distPath}).outputURL(url);
	},
	renderc({url, distPath, origin}) {
		if (!Renderer[distPath]) {
			Renderer[distPath] = new DistRenderer({url: origin, distPath});
		}
		return Renderer[distPath].outputURL(url);
	}
};

process.on('message', (message) => {
	let {id, type, data} = message;
	Tasks[type](data).then(result => {
		process.send({id, data: result});
	});
});