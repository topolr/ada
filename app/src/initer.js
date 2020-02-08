function initer(context) {
	context.hook("sourceexcute", ({ name, code }) => {
		console.log('=>', name);
	});
	context.hook('servicewroker', (a) => {
		console.log(a);
	});
}

module.exports = initer;