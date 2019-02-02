"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar = require("chokidar");
const path = require("path");
const startsWith = require("lodash/startsWith");
class DevHotReloader {
    constructor(dirname, extnames = [".ts", ".js", ".json"]) {
        this.watcher = DevHotReloader.watchers[dirname] = chokidar.watch(dirname, {
            awaitWriteFinish: true,
            followSymlinks: false
        });
        this.watcher.on("add", filename => {
            let ext = path.extname(filename);
            if (extnames.includes(ext)) {
                require(filename);
            }
        }).on("change", filename => {
            if (require.cache[filename]) {
                delete require.cache[filename];
                require(filename);
            }
        }).on("unlink", filename => {
            if (require.cache[filename])
                delete require.cache[filename];
        }).on("unlinkDir", dirname => {
            dirname = dirname + path.sep;
            for (let filename in require.cache) {
                if (startsWith(filename, dirname))
                    delete require.cache[filename];
            }
        });
    }
    close() {
        this.watcher.close();
    }
}
exports.DevHotReloader = DevHotReloader;
(function (DevHotReloader) {
    DevHotReloader.watchers = {};
})(DevHotReloader = exports.DevHotReloader || (exports.DevHotReloader = {}));
//# sourceMappingURL=DevHotReloader.js.map