import * as Worker from "sfn-worker";
import { config } from "../../bootstrap/ConfigLoader";
import { dgram } from "../../bootstrap/index";

export type CLIMessage = {
    address?: string;
    port?: number;
    timeout?: number;
};

dgram.on("worker-reload", (timeout: number, rinfo) => {
    Worker.to(config.workers[0])
        .emit("worker-reload", Object.assign({ timeout }, rinfo));
});

Worker.on("online", worker => {
    // when a worker should reload, safe to reboot the process.
    worker.on("worker-should-reload", (msg: CLIMessage) => {
        worker.reboot();
        worker.once("server-restarted", () => {
            let i = config.workers.indexOf(worker.id),
                nextWorker = config.workers[i + 1];

            if (nextWorker) {
                Worker.to(nextWorker).emit("worker-reload", msg);
            } else if (msg.address && msg.port) {
                // aware the CLI that the application is closed.
                dgram.to(msg.address, msg.port).emit("worker-reloaded");
            }
        });
    });
});