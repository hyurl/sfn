import * as program from "commander";
import { isDevMode, config } from "../../core/bootstrap/ConfigLoader";
import { notifyReload } from "../../core/tools/functions";

// Command `sfn reload` is used to reload the workers sequentially.
// A worker may not reload immediately when receiving the command, and even 
// refuse to reload when there are unclosed connections (especially with 
// WebSocket), you can provide the option `--timeout` to force the the service 
// to reload no matter what in the given seconds. If no timeout is provided, its
// default value would be 5 seconds.
program.command("reload")
    .description("reload workers")
    .option("-t, --timeout <timeout>", "set a timeout to force reload")
    .action(cmd => {
        if (!config.server.dgram.enabled) {
            process.exit();
        }

        let timeout = !isNaN(cmd.timeout)
            ? parseInt(cmd.timeout) * 1000
            : (isDevMode ? 100 : 5000);

        notifyReload(timeout, () => process.exit());
    });