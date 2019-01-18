require("@babel/register")({
	presets: [
		"@babel/typescript", ["@babel/env", {"targets": {"chrome": "60"}}]
	],
	plugins: [
		["@babel/plugin-transform-runtime", {
			"helpers": true,
			"regenerator": true
		}],
		["@babel/plugin-proposal-decorators", {"legacy": true}],
		["@babel/plugin-proposal-class-properties", {"loose": true}],
		"@babel/transform-async-to-generator",
		'dynamic-import-node',
		"@babel/plugin-proposal-function-bind",
		"@babel/plugin-syntax-export-extensions",
		"@babel/plugin-proposal-do-expressions",
		"@babel/plugin-proposal-object-rest-spread"
	]
});
require("./index");