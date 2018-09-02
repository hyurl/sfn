"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Worker = require("sfn-worker");
const index_1 = require("../../bootstrap/index");
const ConfigLoader_1 = require("../../bootstrap/ConfigLoader");
index_1.dgram.on("app-stop", (msg, rinfo) => {
    let workerId = msg.workerId || ConfigLoader_1.config.workers[0];
    Worker.to(workerId).emit("worker-stop", Object.assign(msg, rinfo));
});
Worker.on("online", worker => {
    worker.on("worker-should-stop", (msg, nextWorkerId) => {
        worker.exit();
        if (nextWorkerId) {
            Worker.to(nextWorkerId).emit("worker-stop", msg);
        }
        else if (msg.address && msg.port) {
            index_1.dgram.to(msg.address, msg.port).emit("app-stop", () => {
                if (!msg.workerId)
                    process.exit();
            });
        }
    });
});
//# sourceMappingURL=app-stop.js.map