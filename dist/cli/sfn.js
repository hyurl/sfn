#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const fs = require("fs-extra");
const path = require("path");
const program = require("commander");
const pluralize = require("pluralize");
const kebabCase = require("lodash/kebabCase");
const camelCase = require("lodash/camelCase");
const upperFirst = require("lodash/upperFirst");
const cloneDeep = require("lodash/cloneDeep");
const get = require("lodash/get");
const init_1 = require("../init");
const load_config_1 = require("../core/bootstrap/load-config");
const color_1 = require("../core/tools/internal/color");
const repl_1 = require("../core/tools/internal/repl");
const module_1 = require("../core/tools/internal/module");
const tryImport = module_1.createImport(require);
var sfnd = path.normalize(__dirname + "/../..");
var tplDir = `${sfnd}/templates`;
program.description("create new controllers, models. etc.")
    .version(init_1.version, "-v, --version")
    .option("-c, --controller <name>", "create a new controller with a specified name")
    .option("-m, --model <name>", "create a new model with a specified name")
    .option("-s, --service <name>", "create a new service with a specified name")
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
program.command("init")
    .description("initiate a new project")
    .action(() => {
    require("./init");
    process.exit();
});
let cliBootstrap = init_1.APP_PATH + "/bootstrap/cli";
module_1.moduleExists(cliBootstrap) && tryImport(cliBootstrap);
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
    console.log(color_1.green `${type} '${filename}' created.`);
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
        let type = program.type == "websocket" ? "WebSocket" : "Http", ControllerName = upperFirst(path.basename(program.controller)), mod = camelCase(ControllerName), input = `${tplDir}/${type}Controller.ts`, output = `${init_1.SRC_PATH}/controllers/${filename}.ts`;
        checkSource(input);
        let route = kebabCase(program.controller);
        let contents = fs.readFileSync(input, "utf8")
            .replace(/\{name\}/g, route)
            .replace(/__Controller__/g, ControllerName)
            .replace(/__mod__/g, mod);
        outputFile(output, contents, "controller");
    }
    else if (program.model) {
        let ModelName = upperFirst(path.basename(program.model)), table = pluralize(kebabCase(ModelName)), mod = camelCase(ModelName), filename = path.dirname(program.model) + "/" + mod, input = `${tplDir}/Model.ts`, output = `${init_1.SRC_PATH}/models/${filename}.ts`;
        checkSource(input);
        let contents = fs.readFileSync(input, "utf8")
            .replace(/__Model__/g, ModelName)
            .replace(/__table__/g, table)
            .replace(/__mod__/g, mod);
        outputFile(output, contents, "Model");
    }
    else if (program.service) {
        let ServiceName = upperFirst(path.basename(program.service)), mod = camelCase(ServiceName), filename = path.dirname(program.service) + "/" + mod, input = `${tplDir}/Service.ts`, output = `${init_1.SRC_PATH}/services/${filename}.ts`;
        checkSource(input);
        let contents = fs.readFileSync(input, "utf8")
            .replace(/__Service__/g, ServiceName)
            .replace(/__mod__/g, mod);
        outputFile(output, contents, "Service");
    }
    else if (program.language) {
        let output = `${init_1.SRC_PATH}/locales/${program.language}.json`;
        let mod = get(app.locales, load_config_1.config.lang);
        let lang;
        let contents;
        if (mod && mod.proto) {
            lang = cloneDeep(mod.instance());
            for (let x in lang) {
                lang[x] = "";
            }
        }
        else {
            lang = {};
        }
        contents = JSON.stringify(lang, null, "    ");
        outputFile(output, contents, "Language pack");
    }
    else if (process.argv.length > 2) {
        let serverId = process.argv[2];
        if (serverId === "repl") {
            serverId = process.argv[3];
        }
        require("../bootstrap/index");
        repl_1.connect(serverId).catch((err) => {
            console.log(err);
            process.exit(1);
        });
    }
    else {
        program.help();
        process.exit();
    }
}
catch (err) {
    console.log(color_1.red `${err.toString()}`);
    process.exit();
}
//# sourceMappingURL=sfn.js.map