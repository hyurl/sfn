"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dynamic_queue_1 = require("dynamic-queue");
const index_1 = require("../../bootstrap/index");
index_1.worker.on("worker-reload", (msg) => {
    let queue = new dynamic_queue_1.Queue();
    closeServersInQueue(queue, msg.timeout);
    queue.push(() => {
        index_1.worker.emit("worker-should-reload", msg);
    });
});
function closeServersInQueue(queue, timeout) {
    if (index_1.http) {
        queue.push(next => {
            let timer = setTimeout(() => {
                index_1.http.emit("close");
            }, timeout);
            index_1.http.close(() => {
                clearTimeout(timer);
                next();
            });
        });
    }
}
exports.closeServersInQueue = closeServersInQueue;
//# sourceMappingURL=worker-reload.js.map