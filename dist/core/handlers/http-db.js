"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const modelar_1 = require("modelar");
const index_1 = require("../bootstrap/index");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const symbols_1 = require("../tools/symbols");
index_1.app.use((req, res, next) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    Object.defineProperty(req, "db", {
        get() {
            if (req[symbols_1.realDB] === undefined) {
                req[symbols_1.realDB] = new modelar_1.DB(ConfigLoader_1.config.database);
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
//# sourceMappingURL=http-db.js.map