"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Worker = require("sfn-worker");
const ConfigLoader_1 = require("../../bootstrap/ConfigLoader");
const index_1 = require("../../bootstrap/index");
index_1.dgram.on("worker-reload", (timeout, rinfo) => {
    Worker.to(ConfigLoader_1.config.workers[0])
        .emit("worker-reload", Object.assign({ timeout }, rinfo));
});
Worker.on("online", worker => {
    worker.on("worker-should-reload", (msg) => {
        worker.reboot();
        worker.once("server-restarted", () => {
            let i = ConfigLoader_1.config.workers.indexOf(worker.id), nextWorker = ConfigLoader_1.config.workers[i + 1];
            if (nextWorker) {
                Worker.to(nextWorker).emit("worker-reload", msg);
            }
            else if (msg.address && msg.port) {
                index_1.dgram.to(msg.address, msg.port).emit("worker-reloaded");
            }
        });
    });
});
//# sourceMappingURL=worker-reload.js.map