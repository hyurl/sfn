"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
class HttpError extends Error {
    constructor(code, message) {
        message = message || http_1.STATUS_CODES[code];
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        message = `${code} ${message}`;
        var stack = this.stack.substring(this.stack.indexOf("\n"));
        this.stack = `${this.name}: ${message}${stack}`;
    }
    toString() {
        return this.stack.substring(0, this.stack.indexOf("\n"));
    }
}
exports.HttpError = HttpError;
//# sourceMappingURL=HttpError.js.map