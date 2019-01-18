#!/usr/bin/env node
let {Commander} = require("ada-util");
let commander = new Commander();
[
	require("./cmd/version"),
	require("./cmd/init"),
	require("./cmd/create"),
	require("./cmd/extends"),
	require("./cmd/clone"),
	require("./cmd/gtcss")
].forEach(function (a) {
	let command = a.command, desc = a.desc, paras = a.paras, fn = a.fn;
	commander.bind({command, desc, paras, fn});
});
commander.call(process.argv.slice(2));