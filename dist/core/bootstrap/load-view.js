"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const alar = require("alar");
const init_1 = require("../../init");
global["app"].views = new alar.ModuleProxy("views", init_1.SRC_PATH + "/views");
app.views.setLoader({
    cache: {},
    extesion: ".html",
    load(file) {
        if (!this.cache[file]) {
            let contents = fs.readFileSync(file, "utf8");
            this.cache[file] = {
                render: () => {
                    return contents;
                }
            };
        }
        return this.cache[file];
    },
    unload(path) {
        delete this.cache[path];
    }
});
//# sourceMappingURL=load-view.js.map