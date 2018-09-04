import { Queue } from "dynamic-queue";
import { worker, http } from "../../bootstrap/index";
import { CLIMessage } from "../master/worker-reload";

// smoothly reboot the worker
worker.on("worker-reload", (msg: CLIMessage) => {
    let queue = new Queue();

    closeServersInQueue(queue, msg.timeout);

    queue.push(() => {
        // notify the master that services have been closed and safe to reload.
        worker.emit("worker-should-reload", msg);
    });
});

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
}