"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Controller_1 = require("./Controller");
const index_1 = require("../../index");
class WebSocketController extends Controller_1.Controller {
    constructor(socket, next = null) {
        super();
        this.Class = this.constructor;
        this.authorized = socket.user !== null;
        this.socket = socket;
        this.isAsync = next instanceof Function;
        this.lang = (socket.cookies && socket.cookies.lang)
            || socket.lang
            || index_1.config.lang;
    }
    get db() {
        return this.socket.db;
    }
    set db(v) {
        this.socket.db = v;
    }
    get session() {
        return this.socket.session;
    }
    get user() {
        return this.socket.user;
    }
}
exports.WebSocketController = WebSocketController;
//# sourceMappingURL=WebSocketController.js.map