"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const child_process_1 = require("child_process");
const init_1 = require("../../init");
const functions_inner_1 = require("../../core/tools/functions-inner");
const functions_1 = require("../../core/tools/functions");
const functions_inner_2 = require("../../core/tools/functions-inner");
const ConfigLoader_1 = require("../../core/bootstrap/ConfigLoader");
program.command("restart")
    .description("restart service")
    .option("-t, --timeout <timeout>", "set a timeout to force stop")
    .action((cmd) => {
    console.log(functions_inner_1.grey `Stopping service...`);
    let client = functions_1.getDgramClient(), task = null, createTask = () => {
        return child_process_1.spawn(process.execPath, [
            init_1.APP_PATH + "/index.js",
            `--udp-client=127.0.0.1:${client.address()["port"]}`
        ], {
            detached: true,
            stdio: "inherit",
            windowsHide: true
        });
    };
    if (!client) {
        process.exit();
    }
    let timeout = !isNaN(cmd.timeout)
        ? parseInt(cmd.timeout) * 1000
        : (ConfigLoader_1.isDevMode ? 100 : 5000);
    client.bind(0);
    client.on("service-started", (msg) => {
        console.log(msg);
        process.nextTick(() => {
            task.unref();
            process.exit();
        });
    }).on("service-stopped", () => {
        task = createTask();
        task.on("error", (err) => {
            console.log(functions_inner_2.red `${err.toString()}`);
        });
    }).emit("service-stop", timeout, () => {
        console.log(functions_inner_1.grey `Service restarting...`);
    });
});
//# sourceMappingURL=restart.js.map