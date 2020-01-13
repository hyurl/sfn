#!/usr/bin/env node
import "source-map-support/register";
import * as fs from "fs-extra";
import * as path from "path";
import * as program from "commander";
import camelCase = require("lodash/camelCase");
import upperFirst = require("lodash/upperFirst");
import get = require('lodash/get');
import { version, APP_PATH, SRC_PATH } from "../init";
import { green, red } from "../core/tools/internal/color";
import { connect as connectRepl } from "../core/tools/internal/repl";
import { moduleExists, createImport } from "../core/tools/internal/module";

const tryImport = createImport(require);
var sfnd = path.normalize(__dirname + "/../..");
var tplDir = `${sfnd}/templates`;
var replSessionOpen = false;

program.description("create new controllers, services. etc.")
    .version(version, "-v, --version")
    .option("-c, --controller <name>", "create a new controller with a specified name")
    .option("-s, --service <name>", "create a new service with a specified name")
    .option("-l, --language <name>", "create a new language pack with a specified name")
    .option("-t, --type <type>", "set the type 'http' (default) or 'websocket' when creating a controller")
    .on("--help", () => {
        console.log("\nExamples:");
        console.log("  sfn -c article                   create an http controller of article");
        console.log("  sfn -c article -t websocket      create a websocket controller of article");
        console.log("  sfn -s article                   create an article service");
        console.log("  sfn -l zh-CN                     create a language pack of zh-CN");
        console.log("  sfn repl web-server              open REPL session to web-server");
        console.log("");
    });

// Command `sfn init` is used to initiate the project.
program.command("init")
    .description("initiate a new project")
    .action(() => {
        tryImport("./init");
        process.exit();
    });

// Command `sfn repl <appId>` is used to open REPL session.
program.command("repl <appId>")
    .option("--no-stdout", "do not display any data output to process.stdout")
    .description("open REPL session to the given server")
    .action(openREPLSession);

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

function openREPLSession(appId: string, options: { stdout: boolean }) {
    if (replSessionOpen) return;

    if (!appId) {
        console.error(red`Cannot open REPL session without appId`);
        process.exit(1);
    } else {
        replSessionOpen = true;
    }

    // Load user-defined bootstrap procedures.
    let bootstrap = APP_PATH + "/bootstrap/index";
    moduleExists(bootstrap) && tryImport(bootstrap);

    connectRepl(appId, !options.stdout).catch((err) => {
        if (/^Error: connect/.test(err.toString())) {
            console.error(red`(code: ${err["code"]}) failed to connect [${appId}]`);
        } else {
            console.error(red`${err.toString()}`);
        }

        process.exit(1);
    });
}

try {
    if (program.controller) { // create controller.
        let filename = lastChar(program.controller) == "/"
            ? program.controller + "index"
            : (<string>program.controller).toLowerCase();
        let type = program.type == "websocket" ? "WebSocket" : "Http",
            ControllerName = upperFirst(path.basename(program.controller)),
            input = `${tplDir}/${type}Controller.ts`,
            output = `${SRC_PATH}/controllers/${filename}.ts`;

        checkSource(input);

        let route = (<string>program.controller).toLowerCase();
        let contents = fs.readFileSync(input, "utf8")
            .replace(/\{name\}/g, route)
            .replace(/__Controller__/g, ControllerName);

        outputFile(output, contents, "controller");
    } else if (program.service) { // create service
        let ServiceName = upperFirst(path.basename(program.service)),
            mod = camelCase(ServiceName),
            filename = path.dirname(program.service) + "/" + mod,
            input = `${tplDir}/Service.ts`,
            output = `${SRC_PATH}/services/${filename}.ts`;

        checkSource(input);

        let contents = fs.readFileSync(input, "utf8")
            .replace(/__Service__/g, ServiceName + "Service")
            .replace(/__mod__/g, mod);

        outputFile(output, contents, "Service");
    } else if (program.language) { // create language pack.
        let names = program.language.split("-");

        if (names.length > 1) {
            program.language = names[0] + "-" + names[1].toUpperCase();
        }

        let output: string = `${SRC_PATH}/locales/${program.language}.json`;
        let lang = get(app.locales.translations, app.config.lang, {});
        let contents: string;

        contents = JSON.stringify(lang, null, "    ");
        outputFile(output, contents, "Language pack");
    } else if (process.argv.length >= 3) {
        // open REPL session, internal usage
        openREPLSession(process.argv[2], {
            stdout: process.argv[3] !== "--no-stdout"
        });
    } else if (process.argv.length <= 3) {
        program.help();
        process.exit();
    }
} catch (err) {
    console.error(red`${err.toString()}`);
    process.exit(1);
}