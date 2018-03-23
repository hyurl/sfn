"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const date = require("sfn-date");
const Worker = require("sfn-worker");
const init_1 = require("../../init");
class DevWatcher {
    constructor(dirname, extnames = [".js", ".json", ".node"]) {
        if (Worker.isWorker) {
            throw new Error(`${this.constructor.name} can only be used in the master process.`);
        }
        this.watcher = fs.watch(dirname, {
            recursive: true,
        }, (event, filename) => {
            let ext = path.extname(filename);
            if (event === "change" && extnames.includes(ext)) {
                Worker.getWorkers(workers => {
                    let dateTime = `[${date("Y-m-d H:i:s.ms")}]`.cyan;
                    console.log(`${dateTime} HTTP Server restarting...`);
                    if (workers.length) {
                        for (let worker of workers) {
                            worker.reboot();
                        }
                    }
                    else {
                        for (let id of init_1.config.workers) {
                            new Worker(id, init_1.config.env !== "dev");
                        }
                    }
                });
            }
        });
    }
    close() {
        this.watcher.close();
    }
}
exports.DevWatcher = DevWatcher;
//# sourceMappingURL=DevWatcher.js.map