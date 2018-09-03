import WordTable = require("word-table");
import * as program from "commander";
import { red } from "../../core/tools/functions-inner";
import { listWorkers } from "../../core/tools/functions";

// Command `sfn list` is used to list out all the workers.
program.command("list")
    .description("list workers")
    .action(() => {
        listWorkers((err, header, body) => {
            if (err) {
                console.log(red(err.toString()));
                process.exit();
            }

            console.log(new WordTable(header, body).string());
            process.exit();
        }, true);
    });