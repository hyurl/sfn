require("./env-fix");
const path = require("path");

let isTsNode = process.execArgv.join(" ").includes("ts-node");
let entry = path.dirname(process.mainModule.filename);

if (isTsNode && entry === path.resolve(__dirname, "src")) {
    module.exports = require("./src");
} else {
    module.exports = require("./dist");
}