"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sfn_1 = require("sfn");
class IndexController extends sfn_1.HttpController {
    async index() {
        return this.view("index");
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