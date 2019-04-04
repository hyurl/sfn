#!/usr/bin/env node
import * as fs from "fs-extra";
import * as path from "path";
import * as program from "commander";
import pluralize = require("pluralize");
import kebabCase = require("lodash/kebabCase");
import camelCase = require("lodash/camelCase");
import upperFirst = require("lodash/upperFirst");
import cloneDeep = require('lodash/cloneDeep');
import get = require('lodash/get');
import { version, APP_PATH, SRC_PATH } from "../init";
import { config } from "../core/bootstrap/load-config";
import {
    green,
    red,
    moduleExists,
    createImport
} from "../core/tools/functions-inner";
import { Locale } from '../core/tools/interfaces';

const tryImport = createImport(require);
var sfnd = path.normalize(__dirname + "/../..");
var tplDir = `${sfnd}/templates`;

program.description("create new controllers, models. etc.")
    .version(version, "-v, --version")
    .option("-c, --controller <name>", "create a new controller with a specified name")
    .option("-m, --model <name>", "create a new model with a specified name")
    .option("-s, --service <name>", "create a new service with a specified name")
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

// Command `sfn init` is used to initiate the project.
program.command("init")
    .description("initiate a new project")
    .action(() => {
        require("./init");
        process.exit();
    });

// Load user-defined bootstrap procedures.
let cliBootstrap = APP_PATH + "/bootstrap/cli";
moduleExists(cliBootstrap) && tryImport(cliBootstrap);

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
            ControllerName = upperFirst(path.basename(program.controller)),
            mod = camelCase(ControllerName),
            input = `${tplDir}/${type}Controller.ts`,
            output = `${SRC_PATH}/controllers/${filename}.ts`;

        checkSource(input);

        let route = kebabCase(program.controller);
        let contents = fs.readFileSync(input, "utf8")
            .replace(/\{name\}/g, route)
            .replace(/__Controller__/g, ControllerName)
            .replace(/__mod__/g, mod);

        outputFile(output, contents, "controller");
    } else if (program.model) { // create model.
        let ModelName = upperFirst(path.basename(program.model)),
            table = pluralize(kebabCase(ModelName)),
            mod = camelCase(ModelName),
            filename = path.dirname(program.model) + "/" + mod,
            input = `${tplDir}/Model.ts`,
            output = `${SRC_PATH}/models/${filename}.ts`;

        checkSource(input);

        let contents = fs.readFileSync(input, "utf8")
            .replace(/__Model__/g, ModelName)
            .replace(/__table__/g, table)
            .replace(/__mod__/g, mod);

        outputFile(output, contents, "Model");
    } else if (program.service) { // create service
        let ServiceName = upperFirst(path.basename(program.service)),
            mod = camelCase(ServiceName),
            filename = path.dirname(program.service) + "/" + mod,
            input = `${tplDir}/Service.ts`,
            output = `${SRC_PATH}/services/${filename}.ts`;

        checkSource(input);

        let contents = fs.readFileSync(input, "utf8")
            .replace(/__Service__/g, ServiceName)
            .replace(/__mod__/g, mod);

        outputFile(output, contents, "Service");
    } else if (program.language) { // create language pack.
        let output: string = `${SRC_PATH}/locales/${program.language}.json`;
        let mod: ModuleProxy<Locale> = get(app.locales, config.lang);
        let lang: Locale;
        let contents: string;

        if (mod && mod.proto) {
            lang = cloneDeep(mod.instance());

            for (let x in lang) {
                lang[x] = "";
            }
        } else {
            lang = {};
        }

        contents = JSON.stringify(lang, null, "    ");
        outputFile(output, contents, "Language pack");
    } else if (process.argv.length <= 2) {
        program.help();
        process.exit();
    }
} catch (err) {
    console.log(red`${err.toString()}`);
    process.exit();
}