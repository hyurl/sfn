"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dynamic_queue_1 = require("dynamic-queue");
const index_1 = require("../bootstrap/index");
const modelar_1 = require("modelar");
process.on("SIGINT", shutdown);
process.on("message", msg => {
    if (msg == "shutdown") {
        shutdown();
    }
});
function shutdown() {
    let queue = new dynamic_queue_1.Queue();
    closeServersInQueue(queue, 500);
    queue.push(() => {
        process.exit();
    });
}
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
    queue.push(next => {
        modelar_1.DB.close();
        setTimeout(() => {
            next();
        }, 200);
    });
}
exports.closeServersInQueue = closeServersInQueue;
//# sourceMappingURL=worker-shutdown.js.map