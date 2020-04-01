#!/usr/bin/env node
import "source-map-support/register";
import * as fs from "fs-extra";
import * as path from "path";
import * as program from "commander";
import get = require('lodash/get');
import camelCase = require("lodash/camelCase");
import upperFirst = require("lodash/upperFirst");
import startsWith = require('lodash/startsWith');
import isEmpty from "@hyurl/utils/isEmpty";
import { version, APP_PATH, SRC_PATH } from "../init";
import { green, red } from "../core/tools/internal/color";
import { connect as connectRepl } from "../core/tools/internal/repl";
import { moduleExists, createImport, loadConfig } from "../core/tools/internal/module";

global.app.config = loadConfig();

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
        console.log("  sfn [repl] web-server            open REPL session to web-server");
        console.log("  sfn [run] src/scripts/test.ts    run the script 'src/scripts/test.ts'");
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

program.command("run <filename>")
    .description("run a script under the service context")
    .action(runScript);

// Load user-defined bootstrap procedures.
let cliBootstrap = APP_PATH + "/bootstrap/cli";
moduleExists(cliBootstrap) && tryImport(cliBootstrap);

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

    connectRepl(appId, !options.stdout).catch((err) => {
        if (/^Error: connect/.test(err.toString())) {
            console.error(red`(code: ${err["code"]}) failed to connect [${appId}]`);
        } else {
            console.error(red`${err.toString()}`);
        }

        process.exit(1);
    });
}

async function runScript(filename: string) {
    try {
        if (!path.isAbsolute(filename))
            filename = path.normalize(app.ROOT_PATH + "/" + filename);

        // Before importing the script, try to resolve the file first, if the
        // script doesn't exist, then raise an error so that the program will
        // not try to connect RPC services afterward.
        if (startsWith(filename, SRC_PATH)) {
            let ext = path.extname(filename);

            if (ext === ".js") {
                filename = require.resolve(filename);
            } else if (ext === ".ts") {
                filename = require.resolve(
                    filename.replace(SRC_PATH, APP_PATH).slice(0, -3) + ".js"
                );
            } else if (fs.existsSync(filename + ".ts")) {
                filename = require.resolve(
                    filename.replace(SRC_PATH, APP_PATH) + ".js"
                );
            } else if (!fs.existsSync(filename + ".js")) {
                filename = require.resolve(filename + ".js");
            }
        } else {
            filename = require.resolve(filename);
        }

        app.id = filename;
        let bootstrap = APP_PATH + "/bootstrap/index";

        if (app.ROOT_PATH !== sfnd) {
            // Load user-defined bootstrap procedures.
            moduleExists(bootstrap) && tryImport(bootstrap);
        }

        await app.rpc.connectAll(true); // connect to RPC services.
        await app.hooks.lifeCycle.startup.invoke(); // invoke start-up hooks.

        require(filename);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

program.parseAsync(process.argv).then(() => {
    let command = !isEmpty(program.args) ? program.args[0] : process.argv[2];

    if (command && ["init", "repl", "run"].includes(command))
        return;

    try {
        if (program.controller) { // create controller.
            let filename = lastChar(program.controller) == "/"
                ? program.controller + "index"
                : (<string>program.controller).toLowerCase();
            let type = program.type == "websocket" ? "WebSocket" : "Http";
            let ControllerName = upperFirst(path.basename(program.controller));
            let input = `${tplDir}/${type}Controller.ts`;
            let output = `${SRC_PATH}/controllers/${filename}.ts`;

            checkSource(input);

            let route = (<string>program.controller).toLowerCase();
            let contents = fs.readFileSync(input, "utf8")
                .replace(/\{name\}/g, route)
                .replace(/__Controller__/g, ControllerName);

            outputFile(output, contents, "controller");
        } else if (program.service) { // create service
            let ServiceName = upperFirst(path.basename(program.service));
            let mod = camelCase(ServiceName);
            let filename = path.dirname(program.service) + "/" + mod;
            let input = `${tplDir}/Service.ts`;
            let output = `${SRC_PATH}/services/${filename}.ts`;

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
            let bootstrap = APP_PATH + "/bootstrap/index";
            let id = process.argv[2];

            if (app.ROOT_PATH === sfnd) {
                // Load user-defined bootstrap procedures.
                moduleExists(bootstrap) && tryImport(bootstrap);
            }

            if (app.config.server.rpc[id] || startsWith(id, "web-server")) {
                openREPLSession(id, {
                    stdout: process.argv[3] !== "--no-stdout"
                });
            } else {
                runScript(id);
            }
        } else if (process.argv.length < 3) {
            program.help();
        }
    } catch (err) {
        console.error(red`${err.toString()}`);
        process.exit(1);
    }
});