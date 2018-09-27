"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
class DevHotReloader {
    constructor(dirname, extnames = [".js", ".json"]) {
        this.watcher = fs.watch(dirname, {
            recursive: true,
        }, (event, filename) => {
            let basename = path.basename(dirname), ext = path.extname(filename);
            if (event === "change" && extnames.includes(ext)) {
                if (basename == filename) {
                    filename = dirname;
                }
                else {
                    filename = path.resolve(dirname, filename);
                }
                if (require.cache[filename]) {
                    delete require.cache[filename];
                    require(filename);
                }
            }
        });
    }
    close() {
        this.watcher.close();
    }
}
exports.DevHotReloader = DevHotReloader;
//# sourceMappingURL=DevHotReloader.js.map