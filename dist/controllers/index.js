"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sfn_1 = require("sfn");
class default_1 extends sfn_1.HttpController {
    async index() {
        return this.view("index", {
            port: app.config.server.http.port
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