"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const ConfigLoader_1 = require("../../core/bootstrap/ConfigLoader");
const functions_1 = require("../../core/tools/functions");
program.command("reload")
    .description("reload workers")
    .option("-t, --timeout <timeout>", "set a timeout to force reload")
    .action(cmd => {
    if (!ConfigLoader_1.config.server.dgram.enabled) {
        process.exit();
    }
    let timeout = !isNaN(cmd.timeout)
        ? parseInt(cmd.timeout) * 1000
        : (ConfigLoader_1.isDevMode ? 100 : 5000);
    functions_1.notifyReload(timeout, () => process.exit());
});
//# sourceMappingURL=reload.js.map