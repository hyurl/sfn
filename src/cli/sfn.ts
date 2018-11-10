#!/usr/bin/env node
import * as fs from "fs-extra";
import * as path from "path";
import * as program from "commander";
import pluralize = require("pluralize");
import filter = require("lodash/filter");
import each = require("lodash/each");
import { hyphenate } from "capitalization";
import { version, APP_PATH, SRC_PATH, isTypeScript } from "../init";
import { config } from "../core/bootstrap/ConfigLoader";
import { loadLanguagePack, green, red } from "../core/tools/functions-inner";

var sfnd = path.normalize(__dirname + "/../..");
var ext = isTypeScript ? "ts" : "js";
var tplDir = `${sfnd}/templates`;

program.description("create new controllers, models. etc.")
    .version(version, "-v, --version")
    .option("-c, --controller <name>", "create a new controller with a specified name")
    .option("-m, --model <name>", "create a new model with a specified name")
    .option("-l, --language <name>", "create a new language pack with a specified name")
    .option("-t, --type <type>", "set the type 'http' (default) or 'websocket' when creating a controller")
    .on("--help", () => {
        console.log("\nExamples:");
        console.log("  sfn -c Article                   create an http controller named 'Article'");
        console.log("  sfn -c ArticleSock -t websocket  create a websocket controller named 'ArticleSock'")
        console.log("  sfn -m Article                   create a model named 'Article'");
        console.log("  sfn -l zh-CN                     create a language pack named 'zh-CN'");
        console.log("");
    });

var cmdDir = path.resolve(__dirname, "commands"),
    files = fs.readdirSync(cmdDir);

// automatically load commands
each(filter(files, file => path.extname(file) == ".js"), file => {
    require(path.resolve(cmdDir, file));
});

// Load user-defined bootstrap procedures.
let cliBootstrap = APP_PATH + "/bootstrap/cli.js";
fs.existsSync(cliBootstrap) && require(cliBootstrap);

program.parse(process.argv);

function outputFile(filename: string, data: any, type: string): void {
    filename = path.normalize(filename);
    var dir = path.dirname(filename);

    if (fs.existsSync(filename)) {
        throw new Error(`${type} '${filename}' already exists.`);
    } else if (!fs.existsSync(dir)) {
        fs.ensureDirSync(dir);
    }

    fs.writeFileSync(filename, data);
    console.log(green`${type} '${filename}' created.`);
    process.exit();
}

function lastChar(str: string): string {
    return str[str.length - 1];
}

function checkSource(filename: string): void {
    if (!fs.existsSync(filename))
        throw new Error(`Source file '${path.normalize(filename)}' is missing.`);
}

try {
    if (program.controller) { // create controller.
        let filename = lastChar(program.controller) == "/"
            ? program.controller + "index"
            : program.controller;
        let type = program.type == "websocket" ? "WebSocket" : "Http",
            input = `${tplDir}/${ext}/${type}Controller.${ext}`,
            output = `${SRC_PATH}/controllers/${filename}.${ext}`;
    
        checkSource(input);
    
        let route = hyphenate(program.controller, true);
        let contents = fs.readFileSync(input, "utf8").replace(/\{name\}/g, route);
    
        outputFile(output, contents, "controller");
    } else if (program.model) { // create model.
        var input = `${tplDir}/${ext}/Model.${ext}`,
            output = `${SRC_PATH}/models/${program.model}.${ext}`,
            ModelName = path.basename(program.model),
            table = pluralize(hyphenate(ModelName, true));
    
        checkSource(input);
    
        var contents = fs.readFileSync(input, "utf8")
            .replace(/__Model__/g, ModelName)
            .replace(/__table__/g, table);
    
        outputFile(output, contents, "Model");
    } else if (program.language) { // create language pack.
        let output: string = `${SRC_PATH}/locales/${program.language}.json`;
        let contents: string;
        let file1 = `${APP_PATH}/locales/${config.lang}.js`;
        let file2 = `${SRC_PATH}/locales/${config.lang}.json`;
        let file3 = `${SRC_PATH}/locales/${config.lang}.js`;
        let lang: any;
    
        if (fs.existsSync(file1)) {
            lang = loadLanguagePack(file1);
        } else if (fs.existsSync(file2)) {
            lang = loadLanguagePack(file2);
        } else if (file3 !== file1 && fs.existsSync(file3)) {
            lang = loadLanguagePack(file3);
        } else {
            lang = {};
        }
    
        contents = JSON.stringify(lang, null, "  ");
        outputFile(output, contents, "Language pack");
    } else if (process.argv.length <= 2) {
        program.help();
        process.exit();
    }
} catch (err) {
    console.log(red`${err.toString()}`);
    process.exit();
}