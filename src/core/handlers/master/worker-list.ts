import * as Worker from "sfn-worker";
import pick = require("lodash/pick");
import { dgram } from "../../bootstrap/index";

dgram.on("worker-list", async (withMaster, rinfo) => {
    let props = ["id", "pid", "state", "rebootTimes"],
        workers = (await Worker.getWorkers()).map(worker => {
            let res = pick(worker, props);
            res.uptime = worker.uptime();
            return res;
        });

    // attach the master process
    if (withMaster) {
        workers.unshift({
            id: "master",
            pid: process.pid,
            state: "online",
            rebootTimes: 0,
            uptime: process.uptime()
        });
    }

    // send feedback to CLI
    dgram.to(rinfo.address, rinfo.port).emit("worker-listed", workers);
});