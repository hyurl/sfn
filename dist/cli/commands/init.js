"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const program = require("commander");
const init_1 = require("../../init");
const functions_inner_1 = require("../../core/tools/functions-inner");
program.command("init")
    .description("initiate a new project")
    .action(() => {
    console.log(functions_inner_1.grey `Initiating...`);
    try {
        let sfnd = path.normalize(__dirname + "/../../.."), tplDir = `${sfnd}/templates`, bootstrap = `${init_1.SRC_PATH}/bootstrap`, assetsDir = `${init_1.SRC_PATH}/assets`, ctrlDir = `${init_1.SRC_PATH}/controllers`, localeDir = `${init_1.SRC_PATH}/locales`, viewDir = `${init_1.SRC_PATH}/views`, modelDir = `${init_1.SRC_PATH}/models`, scheduleDir = `${init_1.SRC_PATH}/schedules`, serviceDir = `${init_1.SRC_PATH}/services`, configFile = `${init_1.SRC_PATH}/config.js`, indexFile = `${init_1.SRC_PATH}/index.js`, envFile = `${init_1.ROOT_PATH}/.env`;
        if (!fs.existsSync(envFile))
            fs.copyFileSync(`${sfnd}/.env`, envFile);
        if (!fs.existsSync(init_1.SRC_PATH))
            fs.ensureDirSync(init_1.SRC_PATH);
        if (!fs.existsSync(assetsDir))
            fs.copySync(`${tplDir}/assets`, assetsDir);
        if (!fs.existsSync(bootstrap)) {
            fs.ensureDirSync(bootstrap);
            fs.writeFileSync(`${bootstrap}/master.ts`, "");
            fs.writeFileSync(`${bootstrap}/worker.ts`, "");
            fs.writeFileSync(`${bootstrap}/http.ts`, "");
            fs.writeFileSync(`${bootstrap}/websocket.ts`, "");
            fs.writeFileSync(`${bootstrap}/cli.ts`, "");
        }
        if (!fs.existsSync(ctrlDir)) {
            let dir = `${tplDir}/controllers`;
            fs.copySync(dir, ctrlDir);
        }
        if (!fs.existsSync(localeDir))
            fs.copySync(`${tplDir}/locales`, localeDir);
        if (!fs.existsSync(viewDir))
            fs.copySync(`${tplDir}/views`, viewDir);
        if (!fs.existsSync(modelDir))
            fs.ensureDirSync(modelDir);
        if (!fs.existsSync(scheduleDir))
            fs.ensureDirSync(scheduleDir);
        if (!fs.existsSync(serviceDir))
            fs.ensureDirSync(serviceDir);
        if (!fs.existsSync(configFile))
            fs.copySync(`${tplDir}/config.ts`, configFile);
        if (!fs.existsSync(indexFile))
            fs.copySync(`${tplDir}/index.ts`, indexFile);
        let dir = `${init_1.ROOT_PATH}/.vscode/`, file = `${dir}/launch.json`;
        if (fs.existsSync(dir) && !fs.existsSync(file)) {
            fs.writeJsonSync(file, {
                version: "0.2.0",
                configurations: [
                    {
                        type: "node",
                        request: "launch",
                        protocol: "auto",
                        name: "Start Server",
                        program: "${workspaceFolder}/dist/index"
                    }
                ]
            }, { spaces: 4 });
        }
        console.log(functions_inner_1.green `Initiation succeed!`);
    }
    catch (err) {
        console.log(functions_inner_1.red `Initiation failed!`);
    }
    process.exit();
});
//# sourceMappingURL=init.js.map