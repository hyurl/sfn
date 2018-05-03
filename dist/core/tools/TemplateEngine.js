"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = require("../../init");
class TemplateEngine {
    constructor(options) {
        this.options = Object.assign({
            cache: !init_1.isDevMode,
            encoding: "utf8"
        }, options);
        if (!(this.renderFile instanceof Function)) {
            throw new ReferenceError(this.constructor.name
                + ".renderFile() is not implemented.");
        }
    }
}
exports.TemplateEngine = TemplateEngine;
//# sourceMappingURL=TemplateEngine.js.map