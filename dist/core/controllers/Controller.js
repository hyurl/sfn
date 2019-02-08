"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Service_1 = require("../tools/Service");
const events_1 = require("events");
;
class Controller extends Service_1.Service {
    constructor() {
        super(...arguments);
        this.authorized = false;
    }
    success(data, code = 200) {
        return {
            success: true,
            code,
            data,
        };
    }
    error(msg, code = 500) {
        msg = msg instanceof Error ? msg.message : msg;
        return {
            success: false,
            code,
            error: msg
        };
    }
    before() { }
    after() { }
    static assign(props) {
        Object.assign(this, props);
        if (this.hasOwnProperty("events")) {
            this.events.emit("finishLoad");
        }
    }
    static finishLoad() {
        return new Promise((resolve) => {
            if (this.filename) {
                resolve();
            }
            else {
                if (!this.hasOwnProperty("events")) {
                    this.events = new events_1.EventEmitter();
                }
                this.events.once("finishLoad", resolve);
            }
        });
    }
}
exports.Controller = Controller;
//# sourceMappingURL=Controller.js.map