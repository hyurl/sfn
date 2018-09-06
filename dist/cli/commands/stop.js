"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const ConfigLoader_1 = require("../../core/bootstrap/ConfigLoader");
const functions_1 = require("../../core/tools/functions");
const functions_inner_1 = require("../../core/tools/functions-inner");
program.command("stop")
    .description("stop service")
    .option("-t, --timeout <timeout>", "set a timeout to force stop")
    .action(cmd => {
    let client = functions_1.getDgramClient();
    if (!client) {
        process.exit();
    }
    client.bind(0);
    let timeout = !isNaN(cmd.timeout)
        ? parseInt(cmd.timeout) * 1000
        : (ConfigLoader_1.isDevMode ? 100 : 5000);
    client.on("service-stopped", () => {
        console.log(functions_inner_1.green `Service stopped!`);
        client.close(() => process.exit());
    }).emit("service-stop", timeout, () => {
        console.log(functions_inner_1.grey `Stopping service...`);
    });
});
//# sourceMappingURL=stop.js.map