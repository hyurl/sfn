"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sfn_1 = require("sfn");
class default_1 extends sfn_1.HttpController {
    index(req) {
        return this.view("index", {
            title: "Service Framework for Node.js",
            protocol: req.protocol,
            host: req.headers.host
        });
    }
    sseTest() {
        var count = 0;
        var timer = setInterval(() => {
            count += 1;
            this.sse.send("Message " + count);
            if (count == 10) {
                clearInterval(timer);
                this.sse.close();
            }
        }, 1000);
    }
}
tslib_1.__decorate([
    sfn_1.route("GET /"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], default_1.prototype, "index", null);
tslib_1.__decorate([
    sfn_1.route("SSE /sse-test"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], default_1.prototype, "sseTest", null);
exports.default = default_1;
//# sourceMappingURL=index.js.map