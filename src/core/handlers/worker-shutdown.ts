import { Queue } from "dynamic-queue";
import { http } from "../bootstrap/index";
import { DB } from "modelar";
import { Service } from "../tools/Service";

// gracefully reboot the worker
process.on("SIGINT", shutdown);

// compatible with Windows
process.on("message", msg => {
    if (msg == "shutdown") {
        process.emit("SIGINT", "SIGINT");
    }
});

function shutdown() {
    let queue = new Queue();

    closeServersInQueue(queue, 500);

    queue.push(next => {
        DB.close(); // try to close all database connections
        setTimeout(() => {
            next();
        }, 200);
    });

    queue.push(async (next) => {
        for (let filename in Service.Caches) {
            await Service.Caches[filename].close();
        }
        next();
    });

    queue.push(() => {
        process.exit();
    });
}

function closeServersInQueue(queue: Queue, timeout: number) {
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
}