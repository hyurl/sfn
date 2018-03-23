"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modelar_1 = require("modelar");
const init_1 = require("../../init");
const symbols_1 = require("../tools/symbols");
function handleHttpDB(app) {
    app.use((req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        Object.defineProperty(req, "db", {
            get() {
                if (req[symbols_1.realDB] === undefined) {
                    req[symbols_1.realDB] = new modelar_1.DB(init_1.config.database);
                }
                return req[symbols_1.realDB];
            },
            set(v) {
                req[symbols_1.realDB] = v;
            }
        });
        let handler = () => {
            if (req[symbols_1.realDB])
                req[symbols_1.realDB].release();
        };
        res.on("finish", handler).on("close", handler);
        yield next();
    }));
}
exports.handleHttpDB = handleHttpDB;
//# sourceMappingURL=HttpDBHandler.js.map