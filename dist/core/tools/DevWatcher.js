"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const date = require("sfn-date");
const Worker = require("sfn-worker");
const chalk_1 = require("chalk");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
var timer = null;
function timerCallback(event, filename, extnames) {
    let ext = path.extname(filename);
    if (event === "change" && extnames.includes(ext)) {
        let dateTime = chalk_1.default.cyan(`[${date("Y-m-d H:i:s.ms")}]`);
        console.log(`${dateTime} HTTP Server restarting...`);
        Worker.getWorkers(workers => {
            if (workers.length) {
                for (let worker of workers) {
                    worker.reboot();
                }
            }
            else {
                for (let id of ConfigLoader_1.config.workers) {
                    new Worker(id, !ConfigLoader_1.isDevMode);
                }
            }
        });
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
            timer = setTimeout(timerCallback, 200, event, filename, extnames);
        });
    }
    close() {
        this.watcher.close();
    }
}
exports.DevWatcher = DevWatcher;
//# sourceMappingURL=DevWatcher.js.map