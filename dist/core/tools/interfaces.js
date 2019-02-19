"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const ExpressSession = require("express-session");
class Session {
    static [Symbol.hasInstance](ins) {
        return ins instanceof ExpressSession["Session"];
    }
}
exports.Session = Session;
class Request {
    static [Symbol.hasInstance](ins) {
        return (ins instanceof http.IncomingMessage)
            || (ins instanceof require("http2").Http2ServerRequest);
    }
}
exports.Request = Request;
class Response {
    static [Symbol.hasInstance](ins) {
        return (ins instanceof http.ServerResponse)
            || (ins instanceof require("http2").Http2ServerResponse);
    }
}
exports.Response = Response;
class WebSocket {
    static [Symbol.hasInstance](ins) {
        return app.ws && ins.server === app.ws;
    }
}
exports.WebSocket = WebSocket;
//# sourceMappingURL=interfaces.js.map