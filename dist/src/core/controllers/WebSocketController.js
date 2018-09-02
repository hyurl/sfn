"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Controller_1 = require("./Controller");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
class WebSocketController extends Controller_1.Controller {
    constructor(socket, next = null) {
        super();
        this.authorized = socket.user !== null;
        this.socket = socket;
        this.isAsync = next instanceof Function;
        this.lang = (socket.cookies && socket.cookies.lang)
            || socket.lang
            || ConfigLoader_1.config.lang;
    }
    get Class() {
        return this.constructor;
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
    set user(v) {
        this.socket.user = v;
    }
}
exports.WebSocketController = WebSocketController;
//# sourceMappingURL=WebSocketController.js.map