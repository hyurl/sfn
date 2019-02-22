"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const alar = require("alar");
const FRON = require("fron");
const init_1 = require("../../init");
global["app"].locales = new alar.ModuleProxy("locales", init_1.SRC_PATH + "/locales");
app.locales.setLoader({
    cache: {},
    extesion: ".json",
    load(path) {
        if (!this.cache[path]) {
            let file = path + this.extesion;
            this.cache[path] = FRON.parse(fs.readFileSync(file, "utf8"), file);
        }
        return this.cache[path];
    },
    unload(path) {
        delete this.cache[path];
    }
});
//# sourceMappingURL=load-locale.js.map