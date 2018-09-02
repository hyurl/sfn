import * as Worker from "sfn-worker";
import pick = require("lodash/pick");
import { dgram } from "../../bootstrap/index";

dgram.on("worker-list", async (msg, rinfo) => {
    let props = ["id", "pid", "state", "rebootTimes"],
        workers = (await Worker.getWorkers()).map(worker => pick(worker, props));

    // attach the master process
    workers.unshift({
        id: "master",
        pid: process.pid,
        state: "online",
        rebootTimes: 0
    });

    // send feedback to CLI
    dgram.to(rinfo.address, rinfo.port).emit("worker-listed", workers);
});