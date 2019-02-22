"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const alar = require("alar");
const init_1 = require("../../init");
global["app"].views = new alar.ModuleProxy("views", init_1.SRC_PATH + "/views");
app.views.setLoader({
    cache: {},
    extesion: ".html",
    load(path) {
        if (!this.cache[path]) {
            let contents = fs.readFileSync(path + this.extesion, "utf8");
            this.cache[path] = {
                render: () => {
                    return contents;
                }
            };
        }
        return this.cache[path];
    },
    unload(path) {
        delete this.cache[path];
    }
});
//# sourceMappingURL=load-view.js.map