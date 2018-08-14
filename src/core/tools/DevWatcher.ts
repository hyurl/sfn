import * as fs from "fs";
import * as path from "path";
import * as date from "sfn-date";
import Worker = require("sfn-worker");
import chalk from "chalk";
import { config, isDevMode } from "../bootstrap/ConfigLoader";

var timer: NodeJS.Timer = null;

function timerCallback(event, filename, extnames) {
    let ext = path.extname(filename);

    if (event === "change" && extnames.includes(ext)) {
        let dateTime: string = chalk.cyan(`[${date("Y-m-d H:i:s.ms")}]`);

        console.log(`${dateTime} HTTP Server restarting...`);

        Worker.getWorkers(workers => {
            if (workers.length) {
                for (let worker of workers) {
                    worker.reboot();
                }
            } else {
                for (let id of config.workers) {
                    new Worker(id, !isDevMode);
                }
            }
        });
    }
}

/**
 * Development mode file watcher, if a directory is watched, when the files in
 * it is modified, the workers will be restarted.
 */
export class DevWatcher {
    readonly watcher: fs.FSWatcher;

    constructor(dirname: string, extnames = [".js", ".json"]) {
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

    close(): void {
        this.watcher.close();
    }
}