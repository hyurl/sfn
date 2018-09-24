"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modelar_1 = require("modelar");
const ConfigLoader_1 = require("../../bootstrap/ConfigLoader");
const index_1 = require("../../bootstrap/index");
const symbols_1 = require("../../tools/symbols");
index_1.ws ? index_1.ws.use(handler) : null;
function handler(socket, next) {
    Object.defineProperty(socket, "db", {
        get: () => {
            if (socket[symbols_1.realDB] === undefined) {
                socket[symbols_1.realDB] = new modelar_1.DB(ConfigLoader_1.config.database);
            }
            return socket[symbols_1.realDB];
        },
        set(v) {
            socket[symbols_1.realDB] = v;
        }
    });
    socket.on("disconnected", () => {
        if (socket[symbols_1.realDB])
            socket[symbols_1.realDB].release();
    });
    next();
}
//# sourceMappingURL=websocket-db.js.map