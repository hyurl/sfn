import WordTable = require("word-table");
import values = require("lodash/values");
import * as Worker from "sfn-worker";
import { promisify } from "es6-promisify";
import * as program from "commander";
import { volume2Str, red } from "../../core/tools/functions-inner";
import { getDgramClient } from "../../core/tools/functions";

// Command `sfn list` is used to list out all the workers.
program.command("list")
    .description("list workers")
    .action((cmd) => {
        let client = getDgramClient();

        if (!client) {
            process.exit();
        }

        let header = ["id", "pid", "state", "reboot", "memory", "cpu"],
            body: Array<(string | number)[]> = [],
            timer = setTimeout(() => {
                console.error(red("Unable to fetch worker information."));
                client.removeAllListeners("worker-list");
                process.exit(1);
            }, 2000);

        client.bind(0); // bind a random port so that the server can send feedback.
        client.on("worker-listed", async (workers: Worker[]) => {
            clearTimeout(timer);
            const pidusage = promisify<any, number>(require("pidusage"));

            for (let worker of workers) {
                let stats = await pidusage(worker.pid);
                body.push(values(Object.assign({}, worker, {
                    memory: volume2Str(stats.memory),
                    cpu: stats.cpu + " %"
                })));
            }

            console.log(new WordTable(header, body).string());
            process.exit();
        }).emit("worker-list");
    });