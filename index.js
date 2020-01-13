require("./env-fix");
const { __exportStar } = require("tslib");

let isTsNode = process.execArgv.join(" ").includes("ts-node");

// The following code is a trick to ensure safe exports, it guarantees all
// functions are exported safely before loading the bootstrap.
// DON'T try to optimize or change it if not knowing what it really does
// under the hood, which myself have forgot as well.
// But I do remember it took me a very long time to think through when I wrote
// it.
if (isTsNode) {
    __exportStar(require("./src"), exports);
    require("./src/core/tools/internal/module").bootstrap();
} else {
    __exportStar(require("./dist"), exports);
    require("./dist/core/tools/internal/module").bootstrap();
}