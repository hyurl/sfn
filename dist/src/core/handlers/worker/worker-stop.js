"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dynamic_queue_1 = require("dynamic-queue");
const index_1 = require("../../bootstrap/index");
const worker_reload_1 = require("./worker-reload");
index_1.worker.on("worker-stop", (msg) => {
    let queue = new dynamic_queue_1.Queue();
    worker_reload_1.closeServersInQueue(queue, msg.timeout);
    queue.push(() => {
        index_1.worker.emit("worker-should-stop", msg);
    });
});
//# sourceMappingURL=worker-stop.js.map