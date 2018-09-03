"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WordTable = require("word-table");
const program = require("commander");
const functions_inner_1 = require("../../core/tools/functions-inner");
const functions_1 = require("../../core/tools/functions");
program.command("list")
    .description("list workers")
    .action(() => {
    functions_1.listWorkers((err, header, body) => {
        if (err) {
            console.log(functions_inner_1.red(err.toString()));
            process.exit();
        }
        console.log(new WordTable(header, body).string());
        process.exit();
    }, true);
});
//# sourceMappingURL=list.js.map