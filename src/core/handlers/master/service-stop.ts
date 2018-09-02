import * as Worker from "sfn-worker";
import { dgram } from "../../bootstrap/index";
import { config } from "../../bootstrap/ConfigLoader";
import { CLIMessage } from "./worker-reload";

dgram.on("service-stop", (timeout: number, rinfo) => {
    Worker.to(config.workers[0])
        .emit("worker-stop", Object.assign({ timeout }, rinfo));
});

Worker.on("online", worker => {
    // when a worker should stop, safe to exit the process.
    worker.on("worker-should-stop", (msg: CLIMessage) => {
        worker.exit();

        let i = config.workers.indexOf(worker.id),
            nextWorker = config.workers[i + 1];

        if (nextWorker) {
            Worker.to(nextWorker).emit("worker-stop", msg);
        } else if (msg.address && msg.port) {
            // aware the CLI that the application is closed.
            dgram.to(msg.address, msg.port).emit("service-stopped", () => {
                process.exit();
            });
        }
    });
});