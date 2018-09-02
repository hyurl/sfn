"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const WordTable = require("word-table");
const values = require("lodash/values");
const es6_promisify_1 = require("es6-promisify");
const program = require("commander");
const functions_inner_1 = require("../../core/tools/functions-inner");
const functions_1 = require("../../core/tools/functions");
program.command("list")
    .description("list workers")
    .action((cmd) => {
    let client = functions_1.getDgramClient();
    if (!client) {
        process.exit();
    }
    let header = ["id", "pid", "state", "reboot", "memory", "cpu"], body = [], timer = setTimeout(() => {
        console.error(functions_inner_1.red("Unable to fetch worker information."));
        client.removeAllListeners("worker-list");
        process.exit(1);
    }, 2000);
    client.bind(0);
    client.on("worker-listed", (workers) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        clearTimeout(timer);
        const pidusage = es6_promisify_1.promisify(require("pidusage"));
        for (let worker of workers) {
            let stats = yield pidusage(worker.pid);
            body.push(values(Object.assign({}, worker, {
                memory: functions_inner_1.volume2Str(stats.memory),
                cpu: stats.cpu + " %"
            })));
        }
        console.log(new WordTable(header, body).string());
        process.exit();
    })).emit("worker-list");
});
//# sourceMappingURL=list.js.map