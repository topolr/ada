let parser = require("./doc/parser/index");
let app = {
    siteURL: "/",
    siteInfo: {
        name: "Ada Web Framework | Fall In Love ❤",
        description: "ada.js is a isomorphic,immutable,integrated,structure-oriented web framework",
        keywords: "javascript,isomorphic,immutable,web framework",
        icons: [
            { "path": "./app/src/icons/48@2x.png", "sizes": "48x48", "type": "image/png" },
            { "path": "./app/src/icons/72@2x.png", "sizes": "72x72", "type": "image/png" },
            { "path": "./app/src/icons/96@2x.png", "sizes": "96x96", "type": "image/png" },
            { "path": "./app/src/icons/144@2x.png", "sizes": "144x144", "type": "image/png" },
            { "path": "./app/src/icons/168@2x.png", "sizes": "168x168", "type": "image/png" },
            { "path": "./app/src/icons/192@2x.png", "sizes": "192x192", "type": "image/png" }
        ],
        charset: "UTF-8",
        meta: [
            { name: 'viewport', content: "width=device-width, initial-scale=1.0, minimum-scale=1.0, user-scalable=no" },
            { name: 'format_detection', content: "telephone=no" },
            { name: 'apple_mobile_web_app_status_bar_style', content: "white" },
            { name: 'apple_mobile_web_app_capable', content: "yes" },
            { property: "og:type", content: "website" },
            { property: "og:url", content: "http://adajs.io" },
            { property: "og:site_name", content: "Ada web framework" }
        ]
    },
    apps: [
        {
            name: 'root',
            basePath: './app/',
            sourcePath: "./src/",
            distPath: "./../dist/",
            entryPath: "./src/entries/",
            main: "./src/root.js",
            hooker: "./src/initer.js",
            // worker: {
            //     path: "./src/worker.js",
            //     scope: "/root/"
            // },
            hook: [
                function (hooker) {
                    hooker.hook("beforePack", () => parser.output())
                }
            ]
        },
        {
            name: 'dist',
            basePath: './app/',
            sourcePath: "./src/",
            distPath: "./../dist/",
            entryPath: "./src/a/",
            main: "./src/dist.js"
        }
    ],
    server: {
        port: 8080
    },
    ssr: {
        output: require("path").resolve(__dirname, "./dist"),
        urls: require("./app/src/menu.json").map(item => item.link)
    },
    hook: [
        function (hooker) {
            hooker.hook("beforePack", () => parser.output())
        }
    ]
};
module.exports = app;