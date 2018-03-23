"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modelar_1 = require("modelar");
const init_1 = require("../../init");
const symbols_1 = require("../tools/symbols");
function handleWebSocketDB(io) {
    io.use((socket, next) => {
        Object.defineProperty(socket, "db", {
            get: () => {
                if (socket[symbols_1.realDB] === undefined) {
                    socket[symbols_1.realDB] = new modelar_1.DB(init_1.config.database);
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
    });
}
exports.handleWebSocketDB = handleWebSocketDB;
//# sourceMappingURL=WebSocketDBHandler.js.map