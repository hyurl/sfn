let isTsNode = process.execArgv.join(" ").includes("ts-node");
module.exports = require(isTsNode ? "./src" : "./dist");