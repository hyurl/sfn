#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const program = require("commander");
const pluralize = require("pluralize");
const kebabCase = require("lodash/kebabCase");
const init_1 = require("../init");
const load_config_1 = require("../core/bootstrap/load-config");
const functions_inner_1 = require("../core/tools/functions-inner");
var sfnd = path.normalize(__dirname + "/../..");
var tplDir = `${sfnd}/templates`;
program.description("create new controllers, models. etc.")
    .version(init_1.version, "-v, --version")
    .option("-c, --controller <name>", "create a new controller with a specified name")
    .option("-m, --model <name>", "create a new model with a specified name")
    .option("-l, --language <name>", "create a new language pack with a specified name")
    .option("-t, --type <type>", "set the type 'http' (default) or 'websocket' when creating a controller")
    .on("--help", () => {
    console.log("\nExamples:");
    console.log("  sfn -c Article                   create an http controller named 'Article'");
    console.log("  sfn -c ArticleSock -t websocket  create a websocket controller named 'ArticleSock'");
    console.log("  sfn -m Article                   create a model named 'Article'");
    console.log("  sfn -l zh-CN                     create a language pack named 'zh-CN'");
    console.log("");
});
let cliBootstrap = init_1.APP_PATH + "/bootstrap/cli.js";
fs.existsSync(cliBootstrap) && require(cliBootstrap);
program.parse(process.argv);
function outputFile(filename, data, type) {
    filename = path.normalize(filename);
    var dir = path.dirname(filename);
    if (fs.existsSync(filename)) {
        throw new Error(`${type} '${filename}' already exists.`);
    }
    else if (!fs.existsSync(dir)) {
        fs.ensureDirSync(dir);
    }
    fs.writeFileSync(filename, data);
    console.log(functions_inner_1.green `${type} '${filename}' created.`);
    process.exit();
}
function lastChar(str) {
    return str[str.length - 1];
}
function checkSource(filename) {
    if (!fs.existsSync(filename))
        throw new Error(`Source file '${path.normalize(filename)}' is missing.`);
}
try {
    if (program.controller) {
        let filename = lastChar(program.controller) == "/"
            ? program.controller + "index"
            : program.controller;
        let type = program.type == "websocket" ? "WebSocket" : "Http", input = `${tplDir}/${type}Controller.ts`, output = `${init_1.SRC_PATH}/controllers/${filename}.ts`;
        checkSource(input);
        let route = kebabCase(program.controller);
        let contents = fs.readFileSync(input, "utf8").replace(/\{name\}/g, route);
        outputFile(output, contents, "controller");
    }
    else if (program.model) {
        var input = `${tplDir}/Model.ts`, output = `${init_1.SRC_PATH}/models/${program.model}.ts`, ModelName = path.basename(program.model), table = pluralize(kebabCase(ModelName));
        checkSource(input);
        var contents = fs.readFileSync(input, "utf8")
            .replace(/__Model__/g, ModelName)
            .replace(/__table__/g, table);
        outputFile(output, contents, "Model");
    }
    else if (program.language) {
        let output = `${init_1.SRC_PATH}/locales/${program.language}.json`;
        let contents;
        let file1 = `${init_1.APP_PATH}/locales/${load_config_1.config.lang}.js`;
        let file2 = `${init_1.SRC_PATH}/locales/${load_config_1.config.lang}.json`;
        let file3 = `${init_1.SRC_PATH}/locales/${load_config_1.config.lang}.js`;
        let lang;
        if (fs.existsSync(file1)) {
            lang = functions_inner_1.loadLanguagePack(file1);
        }
        else if (fs.existsSync(file2)) {
            lang = functions_inner_1.loadLanguagePack(file2);
        }
        else if (file3 !== file1 && fs.existsSync(file3)) {
            lang = functions_inner_1.loadLanguagePack(file3);
        }
        else {
            lang = {};
        }
        contents = JSON.stringify(lang, null, "  ");
        outputFile(output, contents, "Language pack");
    }
    else if (process.argv.length <= 2) {
        program.help();
        process.exit();
    }
}
catch (err) {
    console.log(functions_inner_1.red `${err.toString()}`);
    process.exit();
}
//# sourceMappingURL=sfn.js.map