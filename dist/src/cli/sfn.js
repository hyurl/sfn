#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const program = require("commander");
const pluralize = require("pluralize");
const filter = require("lodash/filter");
const each = require("lodash/each");
const capitalization_1 = require("capitalization");
const init_1 = require("./init");
const init_2 = require("../init");
const ConfigLoader_1 = require("../core/bootstrap/ConfigLoader");
const functions_inner_1 = require("../core/tools/functions-inner");
program.description("create new controllers, models. etc.")
    .version(init_2.version, "-v, --version")
    .option("-c, --controller <name>", "create a new controller with a specified name")
    .option("-m, --model <name>", "create a new model with a specified name")
    .option("-l, --language <name>", "create a new language pack with a specified name")
    .option("-t, --type <type>", "set the type 'http' (default) or 'websocket' when creating a controller")
    .on("--help", () => {
    console.log("  Examples:\n");
    console.log("    sfn -c Article                   create an http controller named 'Article'");
    console.log("    sfn -c ArticleSock -t websocket  create a websocket controller named 'ArticleSock'");
    console.log("    sfn -m Article                   create a model named 'Article'");
    console.log("    sfn -l zh-CN                     create a language pack named 'zh-CN'");
    console.log("");
});
var cmdDir = path.resolve(__dirname, "commands"), files = fs.readdirSync(cmdDir);
each(filter(files, file => path.extname(file) == ".js"), file => {
    require(path.resolve(cmdDir, file));
});
let cliBootstrap = init_2.APP_PATH + "/bootstrap/cli.js";
fs.existsSync(cliBootstrap) ? require(cliBootstrap) : null;
program.parse(process.argv);
function outputFile(filename, data, type) {
    var dir = path.dirname(filename);
    if (fs.existsSync(filename)) {
        throw new Error(`${type} already exists.`);
    }
    else if (!fs.existsSync(dir)) {
        fs.ensureDirSync(dir);
    }
    fs.writeFileSync(filename, data);
    console.log(functions_inner_1.grey(`${type} '${filename}' created.`));
    process.exit();
}
function lastChar(str) {
    return str[str.length - 1];
}
function checkSource(filename) {
    if (!fs.existsSync(filename))
        throw new Error("Source file is missing.");
}
if (program.controller) {
    let filename = lastChar(program.controller) == "/"
        ? program.controller + "index"
        : program.controller;
    let type = program.type == "websocket" ? "WebSocket" : "Http", input = `${init_1.sfnd}/src/cli/templates/${type}Controller.${init_1.ext}`, output = `${init_2.SRC_PATH}/controllers/${filename}.${init_1.ext}`;
    checkSource(input);
    let route = capitalization_1.hyphenate(program.controller, true);
    let contents = fs.readFileSync(input, "utf8").replace(/\{name\}/g, route);
    outputFile(output, contents, "controller");
}
else if (program.model) {
    var input = `${init_1.sfnd}/src/cli/templates/Model.${init_1.ext}`, output = `${init_2.SRC_PATH}/models/${program.model}.${init_1.ext}`, ModelName = path.basename(program.model), table = pluralize(capitalization_1.hyphenate(ModelName, true));
    checkSource(input);
    var contents = fs.readFileSync(input, "utf8")
        .replace(/__Model__/g, ModelName)
        .replace(/__table__/g, table);
    outputFile(output, contents, "Model");
}
else if (program.language) {
    let output = `${init_2.SRC_PATH}/locales/${program.language}.json`;
    let contents;
    let file1 = `${init_2.APP_PATH}/locales/${ConfigLoader_1.config.lang}.js`;
    let file2 = `${init_2.SRC_PATH}/locales/${ConfigLoader_1.config.lang}.json`;
    let file3 = `${init_2.SRC_PATH}/locales/${ConfigLoader_1.config.lang}.js`;
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
}
//# sourceMappingURL=sfn.js.map