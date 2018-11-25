"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Controller_1 = require("./Controller");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const symbols_1 = require("../tools/symbols");
class WebSocketController extends Controller_1.Controller {
    constructor(socket) {
        super();
        this.authorized = socket.user !== null;
        this.socket = socket;
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
    get event() {
        return this[symbols_1.activeEvent]
            || (this[symbols_1.activeEvent] = this.socket[symbols_1.activeEvent]);
    }
}
WebSocketController.nsp = "/";
exports.WebSocketController = WebSocketController;
//# sourceMappingURL=WebSocketController.js.map