"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
class TemplateEngine {
    constructor(options) {
        this.options = Object.assign({
            cache: !index_1.isDevMode,
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