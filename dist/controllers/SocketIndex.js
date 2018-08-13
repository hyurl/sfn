"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sfn_1 = require("sfn");
class default_1 extends sfn_1.WebSocketController {
    index() {
        return `Hello, I'm your socket pal, you can "chat" with me via the `
            + `socket.io client.\n Try typing `
            + `"socket.emit('/repeat-what-I-said', 'Hello, World!')" in you `
            + `browser console and see what's going to happen.`;
    }
    repeatWhatISaid(data) {
        return data;
    }
}
tslib_1.__decorate([
    sfn_1.event("/index"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], default_1.prototype, "index", null);
tslib_1.__decorate([
    sfn_1.event("/repeat-what-I-said"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], default_1.prototype, "repeatWhatISaid", null);
exports.default = default_1;
//# sourceMappingURL=SocketIndex.js.map