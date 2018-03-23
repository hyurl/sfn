"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const init_1 = require("./init");
if (init_1.config.bluebird) {
    global.Promise = require("bluebird");
}
tslib_1.__exportStar(require("./core/bootstrap/index"), exports);
//# sourceMappingURL=index.js.map