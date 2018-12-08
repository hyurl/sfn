"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modelar_1 = require("modelar");
const load_config_1 = require("../bootstrap/load-config");
const symbols_1 = require("../tools/symbols");
function default_1(socket, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        Object.defineProperty(socket, "db", {
            get: () => {
                if (socket[symbols_1.realDB] === undefined) {
                    socket[symbols_1.realDB] = new modelar_1.DB(load_config_1.config.database);
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
        yield next();
    });
}
exports.default = default_1;
//# sourceMappingURL=websocket-db.js.map