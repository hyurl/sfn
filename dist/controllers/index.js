"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sfn_1 = require("sfn");
class default_1 extends sfn_1.HttpController {
    constructor() {
        super(...arguments);
        this.viewExtname = ".ejs";
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
    index() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let data = yield this.view(this.isZh ? "index.zh" : "index", this.indexVars);
            this.res.send(data);
        });
    }
}
tslib_1.__decorate([
    sfn_1.route.get("/"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], default_1.prototype, "index", null);
exports.default = default_1;
//# sourceMappingURL=index.js.map