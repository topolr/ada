let serverUtil = require("./server/util");
let browserUtil = require("./browser/util");
let {isBrowser} = require("../util/helper");

module.exports = isBrowser() ? browserUtil : serverUtil;