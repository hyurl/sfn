require("./env-fix");

let isTsNode = process.execArgv.join(" ").includes("ts-node");

if (isTsNode) {
    module.exports = require("./src");
} else {
    module.exports = require("./dist");
}