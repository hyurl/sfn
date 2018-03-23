import * as fs from "fs";
import * as path from "path";
import * as date from "sfn-date";
import Worker = require("sfn-worker");
import { config } from "../../init";

/**
 * Development mode file watcher, if a directory is watched, when the files in
 * it is modified, the workers will be restarted.
 */
export class DevWatcher {
    watcher: fs.FSWatcher;

    constructor(dirname: string, extnames = [".js", ".json", ".node"]) {
        if (Worker.isWorker) {
            throw new Error(`${this.constructor.name} can only be used in the master process.`);
        }

        this.watcher = fs.watch(dirname, {
            recursive: true,
        }, (event, filename) => {
            let ext = path.extname(filename);
            if (event === "change" && extnames.includes(ext)) {
                Worker.getWorkers(workers => {
                    let dateTime: string = `[${date("Y-m-d H:i:s.ms")}]`.cyan;
                    console.log(`${dateTime} HTTP Server restarting...`);

                    if (workers.length) {
                        for (let worker of workers) {
                            worker.reboot();
                        }
                    } else {
                        for (let id of config.workers) {
                            new Worker(id, config.env !== "dev");
                        }
                    }
                });
            }
        });
    }

    close(): void {
        this.watcher.close();
    }
}