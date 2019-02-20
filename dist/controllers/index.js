"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sfn_1 = require("sfn");
class IndexController extends sfn_1.HttpController {
    constructor() {
        super(...arguments);
        this.isZh = this.lang.includes("zh");
        this.indexVars = {
            anotherLang: this.isZh ? "en-US" : "zh-CN",
            changeLang: this.isZh ? "English (US)" : "中文 (简体)",
            version: sfn_1.version
        };
    }
    async index() {
        return this.view("index", this.indexVars);
    }
}
tslib_1.__decorate([
    sfn_1.route.get("/"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], IndexController.prototype, "index", null);
exports.default = IndexController;
//# sourceMappingURL=index.js.map