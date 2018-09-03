"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const Worker = require("sfn-worker");
const functions_1 = require("./functions");
var timer = null;
function timerCallback(event, filename, extnames) {
    let ext = path.extname(filename);
    if (event === "change" && extnames.includes(ext)) {
        functions_1.notifyReload();
    }
}
class DevWatcher {
    constructor(dirname, extnames = [".js", ".json"]) {
        if (Worker.isWorker) {
            throw new Error(`${this.constructor.name} can only be used in the master process.`);
        }
        this.watcher = fs.watch(dirname, {
            recursive: true,
        }, (event, filename) => {
            clearTimeout(timer);
            timer = setTimeout(timerCallback, 300, event, filename, extnames);
        });
    }
    close() {
        this.watcher.close();
    }
}
exports.DevWatcher = DevWatcher;
//# sourceMappingURL=DevWatcher.js.map