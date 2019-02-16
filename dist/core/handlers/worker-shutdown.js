"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dynamic_queue_1 = require("dynamic-queue");
const index_1 = require("../bootstrap/index");
const modelar_1 = require("modelar");
const Service_1 = require("../tools/Service");
process.on("SIGINT", shutdown);
process.on("message", msg => {
    if (msg == "shutdown") {
        process.emit("SIGINT", "SIGINT");
    }
});
function shutdown() {
    let queue = new dynamic_queue_1.Queue();
    closeServersInQueue(queue, 500);
    queue.push(next => {
        modelar_1.DB.close();
        setTimeout(() => {
            next();
        }, 200);
    });
    queue.push(async (next) => {
        for (let filename in Service_1.Service.Caches) {
            await Service_1.Service.Caches[filename].close();
        }
        next();
    });
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
}
//# sourceMappingURL=worker-shutdown.js.map