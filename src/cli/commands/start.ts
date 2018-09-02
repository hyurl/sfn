import * as program from "commander";
import { spawn, ChildProcess } from "child_process";
import { APP_PATH } from "../../init";
import { grey } from '../../core/tools/functions-inner';
import { getDgramClient } from '../../core/tools/functions';
import { red } from "../../core/tools/functions-inner";

// Command `sfn start` is used to start the application, once the command is 
// executed, the master process will be initiated, and then fork needed workers 
// to start service, that means receiving requests and communications from 
// clients.
// You can provide the option `--daemon` to start the application and run it 
// on background, so that the command line will not hang and exit immediately.
program.command("start")
    .description("start service")
    .option("-d, --daemon", "run the process in daemon mode")
    .action((cmd) => {
        console.log(grey("Service starting..."));

        let client = getDgramClient(),
            task: ChildProcess = null,
            createTask = () => {
                return spawn(process.execPath, [
                    APP_PATH + "/index.js",
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

        // The client binds a random port and pass it to the master process when
        // spawned, thus when the service is ready, the master could send 
        // feedback.
        client.on("service-started", (msg: string) => {
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
                console.log(red(err.toString()));
            });

            if (!cmd.daemon) {
                task.on("exit", (code, signal) => {
                    if (code || signal == "SIGKILL") {
                        task.unref();
                        task = createTask();
                    } else {
                        process.exit();
                    }
                });
            }
        });
    });