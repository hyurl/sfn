let isTsNode = process.execArgv.join(" ").includes("ts-node");
// isTsNode && require("ts-node").register();
module.exports = require(isTsNode ? "./src" : "./dist");