import { Queue } from "dynamic-queue";
import { worker } from "../../bootstrap/index";
import { closeServersInQueue } from "./worker-reload";
import { CLIMessage } from "../master/worker-reload";

// smoothly reboot the worker
worker.on("worker-stop", (msg: CLIMessage) => {
    let queue = new Queue();

    closeServersInQueue(queue, msg.timeout);

    queue.push(() => {
        // aware the master that services have been closed and safe to reload.
        worker.emit("worker-should-stop", msg);
    });
});