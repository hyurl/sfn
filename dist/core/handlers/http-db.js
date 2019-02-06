"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modelar_1 = require("modelar");
const index_1 = require("../bootstrap/index");
const load_config_1 = require("../bootstrap/load-config");
const symbols_1 = require("../tools/symbols");
index_1.router.use(async (req, res, next) => {
    Object.defineProperty(req, "db", {
        get() {
            if (req[symbols_1.realDB] === undefined) {
                req[symbols_1.realDB] = new modelar_1.DB(load_config_1.config.database);
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
    await next();
});
//# sourceMappingURL=http-db.js.map