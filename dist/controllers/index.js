"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sfn_1 = require("sfn");
sfn_1.HttpController.viewExtname = ".ejs";
class IndexController extends sfn_1.HttpController {
    constructor() {
        super(...arguments);
        this.isZh = this.lang.includes("zh");
        this.indexVars = {
            title: "Service Framework for Node.js",
            anotherLang: this.isZh ? "en-US" : "zh-CN",
            changeLang: this.isZh ? "English (US)" : "中文 (简体)",
            home: this.isZh ? "主页" : "Home",
            docs: this.isZh ? "文档" : "Documentation",
            sourceCode: this.isZh ? "源代码" : "Source Code",
            version: sfn_1.version
        };
    }
    async index() {
        let ver = this.isZh ? "index.zh" : "index.en";
        return !sfn_1.isDevMode && this.cache.get(ver) || this.cache.set(ver, await this.view(ver, this.indexVars));
    }
}
IndexController.filename = __filename;
tslib_1.__decorate([
    sfn_1.route.get("/"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], IndexController.prototype, "index", null);
exports.default = IndexController;
//# sourceMappingURL=index.js.map