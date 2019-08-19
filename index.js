require("./env-fix");
const { __exportStar } = require("tslib");

let isTsNode = process.execArgv.join(" ").includes("ts-node");

if (isTsNode) {
    __exportStar(require("./src"), exports);

    require("./src/core/tools/internal/module").bootstrap();
} else {
    __exportStar(require("./dist"), exports);
    require("./dist/core/tools/internal/module").bootstrap();
}