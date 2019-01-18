<!--{"name":"ada-pack","icon":"blackboard","active":false,"desc":"Integrated Web Framework","index":3,"commentId":"4"}-->

[![Build Status](https://travis-ci.org/topolr/ada-pack.svg?branch=master)](https://travis-ci.org/topolr/ada)
[![npm version](https://badge.fury.io/js/ada-pack.svg)](https://badge.fury.io/js/ada-pack)
[![npm](https://img.shields.io/npm/dt/ada-pack.svg?maxAge=2592000)](https://www.npmjs.com/package/ada-pack)
[![license](https://img.shields.io/github/license/topolr/ada-pack.svg?maxAge=2592000)](https://github.com/topolr/ada-pack/blob/master/LICENSE)

ada专属开箱即用的构建打包工具，它会自动检查源代码并根据代码所使用技术动态引入依赖并部署配置

> ada-pack被默认引入ada框架依赖，正常情况下无需单独使用ada-pack

## 安装ada-pack

### 通过npm安装发布的模块

```javascript
npm install ada-pack --save-dev
```
## ada-pack 配置文件

ada-pack配置文件是一个JavaScript文件，比如`app.js`

```javascript
let menu = require("./src/menu");
let {File} = require("ada-util");
let Path = require("path");

let app = {
    siteURL: "/",
    sourcePath: "./src/",
    distPath: "./dist/",
    indexPath: "./dist/index.html",
    entryPath: "./src/entries/",
    main: "./src/root.js",
    staticPath: "./src/static",
    baseInfo: {
        name: "test",
        description: "test",
        icons: [],
        charset: "UTF-8",
        meta: [
            {name: 'viewport', content: "width=device-width, initial-scale=1.0, minimum-scale=1.0, user-scalable=no"},
            {name: 'format_detection', content: "telephone=no"},
            {name: 'apple_mobile_web_app_status_bar_style', content: "white"},
            {name: 'apple_mobile_web_app_capable', content: "yes"}
        ]
    },
    server: {
        proxy: [
            {
                path: "/api/", option: {
                    target: 'http://xxx.xxx.xxx.xxx:xxxx',
                    changeOrigin: true,
                    pathRewrite: {
                        '^/api/xxx/': '/xxx/'
                    }
                }
            }
        ]
    },
    indexPaths() {
        return menu.map(item => item.link);
    },
    entryFiles(config) {
        return new File(Path.resolve(config.sourcePath, "./pages")).getAllSubFilePaths().then(paths => {
            return paths.filter(path => Path.basename(path) === "index.js");
        });
    }
};
module.exports = app;
```

## 默认配置

```javascript
module.exports = {
	basePath: "/",
	sourcePath: "./src/",
	distPath: "./dist/",
	indexPath: "./dist/index.html",
	siteURL: "/",
	main: "./src/root.js",
	initer: "",
	worker: {
		scope: "/",
		path: ""
	},
	entryPath: "./src/entries",
	staticPath: "./src/static",
	entryFiles() {
		return [];
	},
	ignore: [],
	baseInfo: {
		name: "ada",
		icons: [],
		short_name: "ada",
		start_url: "/",
		display: "standalone",
		background_color: "#fff",
		theme_color: "#fff",
		description: "ada web framework.",
		related_applications: [{"platform": "web"}],
		keywords: "",
		charset: "UTF-8",
		meta: [
			{name: 'viewport', content: "width=device-width, initial-scale=1.0, minimum-scale=1.0, user-scalable=no"},
			{name: 'format_detection', content: "telephone=no"},
			{name: 'apple_mobile_web_app_status_bar_style', content: "white"},
			{name: 'apple_mobile_web_app_capable', content: "yes"}
		],
		link: [],
		style: [],
		script: []
	},
	dependence: {
		js: {
			dependence: {
				"uglify-es": "^3.3.8",
				"@babel/cli": "^7.1.0",
				"@babel/core": "^7.1.0",
				"@babel/runtime-corejs2": "^7.1.2",
				"@babel/plugin-proposal-class-properties": "^7.1.0",
				"@babel/plugin-proposal-decorators": "^7.0.0-beta.52",
				"@babel/plugin-proposal-do-expressions": "^7.0.0",
				"@babel/plugin-proposal-function-bind": "^7.0.0",
				"@babel/plugin-proposal-object-rest-spread": "^7.0.0",
				"@babel/plugin-syntax-dynamic-import": "^7.0.0",
				"@babel/plugin-syntax-export-extensions": "^7.0.0-beta.32",
				"@babel/plugin-transform-async-to-generator": "^7.1.0",
				"@babel/plugin-transform-runtime": "^7.1.0",
				"@babel/polyfill": "^7.0.0",
				"@babel/preset-env": "^7.1.0",
				"@babel/preset-typescript": "^7.1.0",
				"@babel/register": "^7.0.0",
				"@babel/runtime": "^7.0.0",
				"express": ""
			},
			maker: "./maker/jsmaker"
		},
		css: {
			dependence: {
				"autoprefixer": "^7.1.6",
				"postcss": "^5.2.5",
				"uglifycss": "^0.0.25",
				"html-minifier": "^3.5.6"
			},
			maker: "./maker/cssmaker"
		},
		scss: {
			dependence: {
				"autoprefixer": "^7.1.6",
				"postcss": "^5.2.5",
				"uglifycss": "^0.0.25",
				"node-sass": "^3.10.1",
				"html-minifier": "^3.5.6"
			},
			maker: "./maker/sassmaker"
		},
		less: {
			dependence: {
				"autoprefixer": "^7.1.6",
				"postcss": "^5.2.5",
				"uglifycss": "^0.0.25",
				"less": "^2.7.1",
				"html-minifier": "^3.5.6"
			},
			maker: "./maker/lessmaker"
		},
		json: {
			dependence: {},
			maker: "./maker/jsonmaker"
		},
		html: {
			dependence: {
				"html-minifier": "^3.5.6"
			},
			maker: "./maker/htmlmaker"
		},
		icon: {
			dependence: {
				"html-minifier": "^3.5.6"
			},
			maker: "./maker/iconmaker"
		},
		ts: {
			dependence: {
				"typescript": "^2.6.2",
				"uglify-es": "^3.3.8",
				"@babel/cli": "^7.1.0",
				"@babel/core": "^7.1.0",
				"@babel/runtime-corejs2": "^7.1.2",
				"@babel/plugin-proposal-class-properties": "^7.1.0",
				"@babel/plugin-proposal-decorators": "^7.0.0-beta.52",
				"@babel/plugin-proposal-do-expressions": "^7.0.0",
				"@babel/plugin-proposal-function-bind": "^7.0.0",
				"@babel/plugin-proposal-object-rest-spread": "^7.0.0",
				"@babel/plugin-syntax-dynamic-import": "^7.0.0",
				"@babel/plugin-syntax-export-extensions": "^7.0.0-beta.32",
				"@babel/plugin-transform-async-to-generator": "^7.1.0",
				"@babel/plugin-transform-runtime": "^7.1.0",
				"@babel/polyfill": "^7.0.0",
				"@babel/preset-env": "^7.1.0",
				"@babel/preset-typescript": "^7.1.0",
				"@babel/register": "^7.0.0",
				"@babel/runtime": "^7.0.0",
			},
			maker: "./lib/maker/tsmaker"
		}
	},
	compiler: {
		babel: {
			presets: [
				"@babel/typescript", ["@babel/env", {"targets": {"chrome": "59"}}]
			],
			plugins: [
				["@babel/plugin-transform-runtime", {
					"helpers": false,
					"regenerator": true
				}],
				["@babel/plugin-proposal-decorators", {"legacy": true}],
				["@babel/plugin-proposal-class-properties", {"loose": true}],
				"@babel/transform-async-to-generator",
				"@babel/plugin-syntax-dynamic-import",
				"@babel/plugin-proposal-function-bind",
				"@babel/plugin-syntax-export-extensions",
				"@babel/plugin-proposal-do-expressions",
				"@babel/plugin-proposal-object-rest-spread"
			]
		},
		uglify: {},
		uglifycss: {},
		postcss: [
			{autoprefixer: {}}
		],
		sass: {},
		minifier: {},
		typescript: ["--target ESNext", "--noEmit", "--pretty", "--skipLibCheck", "--experimentalDecorators"]
	},
	server: {
		protocol: "http",
		host: "localhost",
		port: "8080",
		serverPath: "./server.js",
		proxy: null
	},
	hook: [],
	ssr: {
		urls: [],
		output: ""
	},
	indexPaths() {
		return []
	}
};
```

## package.json

除了以上的配置还有两个默认配置，如果需要修改这个配置，需要修改`package.json`文件。

```javascript
{
  "name": "xxx",
  "scripts": {
    "ada": "node node_modules/adajs/bin/cli",
    "pack": "node node_modules/ada-pack/bin/cli",
    "dev": "node node_modules/ada-pack/bin/cli dev",
    "start": "node node_modules/ada-pack/bin/cli start",
    "publish": "node node_modules/ada-pack/bin/cli publish"
  },
  "ada": {
    "develop": "./app/app.js",
    "publish": "./app/app.js"
  },
  "dependencies": {
    "adajs": "^3.0.0-beta.22"
  },
  "devDependencies": {}
}

```