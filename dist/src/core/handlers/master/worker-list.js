"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Worker = require("sfn-worker");
const pick = require("lodash/pick");
const index_1 = require("../../bootstrap/index");
index_1.dgram.on("worker-list", (msg, rinfo) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    let props = ["id", "pid", "state", "rebootTimes"], workers = (yield Worker.getWorkers()).map(worker => pick(worker, props));
    workers.unshift({
        id: "master",
        pid: process.pid,
        state: "online",
        rebootTimes: 0
    });
    index_1.dgram.to(rinfo.address, rinfo.port).emit("worker-listed", workers);
}));
//# sourceMappingURL=worker-list.js.map