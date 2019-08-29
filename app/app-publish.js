let parser = require("../doc/parser/index");
let app = {
    siteURL: "/",
    sourcePath: "./src/",
    distPath: "./../dist/",
    indexPath: "./../dist/index.html",
    entryPath: "./src/entries/",
    main: "./src/root.js",
    baseInfo: {
        name: "Ada Web Framework | Fall In Love ❤",
        description: "ada.js is a isomorphic,immutable,integrated,structure-oriented web framework",
        keywords: "javascript,isomorphic,immutable,web framework",
        icons: [
            { "src": "icons/48@2x.png", "sizes": "48x48", "type": "image/png" },
            { "src": "icons/72@2x.png", "sizes": "72x72", "type": "image/png" },
            { "src": "icons/96@2x.png", "sizes": "96x96", "type": "image/png" },
            { "src": "icons/144@2x.png", "sizes": "144x144", "type": "image/png" },
            { "src": "icons/168@2x.png", "sizes": "168x168", "type": "image/png" },
            { "src": "icons/192@2x.png", "sizes": "192x192", "type": "image/png" }
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
    server: {
        port: 8080
    },
    ssr: {
        output: require("path").resolve(__dirname, "./../dist"),
        urls: require("./src/menu.json").map(item => item.link)
    },
    hook: [
        function (hooker) {
            hooker.hook("afterPack", () => parser.output().then(() => parser.outputPage()));
        }
    ]
};
module.exports = app;