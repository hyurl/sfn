const path = require("path");

let isTsNode = process.execArgv.join(" ").includes("ts-node");
let entry = process.mainModule.filename.slice(0, -3);

if (isTsNode && entry === path.resolve(__dirname, "src", "index")) {
    module.exports = require("./src");
} else {
    module.exports = require("./dist");
}