"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const child_process_1 = require("child_process");
const init_1 = require("../../init");
const functions_inner_1 = require("../../core/tools/functions-inner");
const functions_1 = require("../../core/tools/functions");
const functions_inner_2 = require("../../core/tools/functions-inner");
program.command("start")
    .description("start service")
    .option("-d, --daemon", "run the process in daemon mode")
    .action((cmd) => {
    console.log(functions_inner_1.grey `Service starting...`);
    let client = functions_1.getDgramClient(), task = null, createTask = () => {
        return child_process_1.spawn(process.execPath, [
            init_1.APP_PATH + "/index.js",
            `--udp-client=127.0.0.1:${client.address()["port"]}`
        ], {
            detached: cmd.daemon,
            stdio: "inherit",
            windowsHide: true
        });
    };
    if (!client) {
        process.exit();
    }
    client.on("service-started", (msg) => {
        console.log(msg);
        process.nextTick(() => {
            if (cmd.daemon) {
                task.unref();
                process.exit();
            }
        });
    }).bind(0, () => {
        task = createTask();
        task.on("error", (err) => {
            console.log(functions_inner_2.red `${err.toString()}`);
        });
        if (!cmd.daemon) {
            task.on("exit", (code, signal) => {
                if (code || signal == "SIGKILL") {
                    task.unref();
                    task = createTask();
                }
                else {
                    process.exit();
                }
            });
        }
    });
});
//# sourceMappingURL=start.js.map