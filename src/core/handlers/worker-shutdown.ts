import { Queue } from "dynamic-queue";
import { http } from "../bootstrap/index";
import { DB } from "modelar";

// gracefully reboot the worker
process.on("SIGINT", shutdown);

// compatible with Windows
process.on("message", msg => {
    if (msg == "shutdown") {
        shutdown();
    }
});

function shutdown() {
    let queue = new Queue();

    closeServersInQueue(queue, 500);

    queue.push(() => {
        process.exit();
    });
}

export function closeServersInQueue(queue: Queue, timeout: number) {
    if (http) {
        queue.push(next => {
            let timer = setTimeout(() => {
                http.emit("close");
            }, timeout);
            http.close(() => {
                clearTimeout(timer);
                next();
            });
        });
    }

    queue.push(next => {
        DB.close(); // try to close all database connections
        setTimeout(() => {
            next();
        }, 200);
    });
}