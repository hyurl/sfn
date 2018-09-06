import * as program from "commander";
import { isDevMode } from "../../core/bootstrap/ConfigLoader";
import { getDgramClient } from "../../core/tools/functions";
import { grey, green } from "../../core/tools/functions-inner";

// Command `sfn stop` is used to terminate the application.
// A worker may not stop immediately when receiving the command, and even refuse
// to stop when there are unclosed connections (especially with WebSocket), you 
// can provide the option `--timeout` to force the the service to stop no matter
// what in the given seconds. If no timeout is provided, its default value would
// be 5 seconds.
program.command("stop")
    .description("stop service")
    .option("-t, --timeout <timeout>", "set a timeout to force stop")
    .action(cmd => {
        let client = getDgramClient();

        if (!client) {
            process.exit();
        }

        client.bind(0);
        let timeout = !isNaN(cmd.timeout)
            ? parseInt(cmd.timeout) * 1000
            : (isDevMode ? 100 : 5000);

        client.on("service-stopped", () => {
            console.log(green`Service stopped!`);
            client.close(() => process.exit());
        }).emit("service-stop", timeout, () => {
            console.log(grey`Stopping service...`);
        });
    });