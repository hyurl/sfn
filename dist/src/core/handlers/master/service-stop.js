"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Worker = require("sfn-worker");
const index_1 = require("../../bootstrap/index");
const ConfigLoader_1 = require("../../bootstrap/ConfigLoader");
index_1.dgram.on("service-stop", (timeout, rinfo) => {
    Worker.to(ConfigLoader_1.config.workers[0])
        .emit("worker-stop", Object.assign({ timeout }, rinfo));
});
Worker.on("online", worker => {
    worker.on("worker-should-stop", (msg) => {
        worker.exit();
        let i = ConfigLoader_1.config.workers.indexOf(worker.id), nextWorker = ConfigLoader_1.config.workers[i + 1];
        if (nextWorker) {
            Worker.to(nextWorker).emit("worker-stop", msg);
        }
        else if (msg.address && msg.port) {
            index_1.dgram.to(msg.address, msg.port).emit("service-stopped", () => {
                process.exit();
            });
        }
    });
});
//# sourceMappingURL=service-stop.js.map