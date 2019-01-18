function initer() {
	this.context.hook("sourceready", (info, done) => {
		console.log(info);
		done();
	});
	this.context.hook("sourceexcute", ({path, code}) => {
		console.log('=>', path);
	});
	this.context.hook("initdone", (a, b) => {
		console.log('--->initdone');
		b();
	});
	this.context.hook("bootdone", (a, b) => {
		console.log('--->bootdone');
		b();
	});
	this.context.hook("recoverdone", (a, b) => {
		console.log('--->recoverdone');
		b();
	});
	this.context.hook("sourceready", (a, b) => {
		console.log('--->sourceready');
		b();
	});
	this.context.hook("sourcepersistence", (a, b) => {
		console.log('--->sourcepersistence');
		b();
	});
}

module.exports = initer;