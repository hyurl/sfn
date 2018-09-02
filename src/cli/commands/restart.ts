import * as program from "commander";
import { spawn, ChildProcess } from "child_process";
import { APP_PATH } from "../../init";
import { grey } from '../../core/tools/functions-inner';
import { getDgramClient } from '../../core/tools/functions';
import { red } from "../../core/tools/functions-inner";
import { isDevMode } from '../../core/bootstrap/ConfigLoader';

// Command `sfn restart` is practically the same as `sfn stop` and 
// `sfn start --daemon`, used to restart the application.
program.command("restart")
    .description("restart service")
    .option("-t, --timeout <timeout>", "set a timeout to force stop")
    .action((cmd) => {
        console.log(grey("Stopping service..."));

        let client = getDgramClient(),
            task: ChildProcess = null,
            createTask = () => {
                return spawn(process.execPath, [
                    APP_PATH + "/index.js",
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
            : (isDevMode ? 100 : 5000);

        // The client binds a random port and pass it to the master process when
        // spawned, thus when the service is ready, the master could send 
        // feedback.
        client.bind(0);
        client.on("service-started", (msg: string) => {
            console.log(msg);

            process.nextTick(() => {
                task.unref();
                process.exit();
            });
        }).on("service-stopped", () => {
            task = createTask();

            task.on("error", (err) => {
                console.log(red(err.toString()));
            });
        }).emit("service-stop", timeout, () => {
            console.log(grey("Service restarting..."));
        });
    });