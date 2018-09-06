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
    console.log(functions_inner_1.red `Initiating...`);
    try {
        let sfnd = path.normalize(__dirname + "/../../.."), ext = init_1.isTypeScript ? "ts" : "js", bootstrap = `${init_1.SRC_PATH}/bootstrap`, assetsDir = `${init_1.SRC_PATH}/assets`, ctrlDir = `${init_1.SRC_PATH}/controllers`, localeDir = `${init_1.SRC_PATH}/locales`, viewDir = `${init_1.SRC_PATH}/views`, modelDir = `${init_1.SRC_PATH}/models`, scheduleDir = `${init_1.SRC_PATH}/schedules`, serviceDir = `${init_1.SRC_PATH}/services`, configFile = `${init_1.SRC_PATH}/config.${ext}`, indexFile = `${init_1.SRC_PATH}/index.${ext}`, envFile = `${init_1.ROOT_PATH}/.env`;
        if (!fs.existsSync(envFile))
            fs.copyFileSync(`${sfnd}/.env`, envFile);
        if (!fs.existsSync(init_1.SRC_PATH))
            fs.ensureDirSync(init_1.SRC_PATH);
        if (!fs.existsSync(assetsDir))
            fs.copySync(`${sfnd}/src/assets`, assetsDir);
        if (!fs.existsSync(bootstrap)) {
            fs.ensureDirSync(bootstrap);
            fs.writeFileSync(`${bootstrap}/master.${ext}`, "");
            fs.writeFileSync(`${bootstrap}/worker.${ext}`, "");
            fs.writeFileSync(`${bootstrap}/http.${ext}`, "");
            fs.writeFileSync(`${bootstrap}/websocket.${ext}`, "");
            fs.writeFileSync(`${bootstrap}/cli.${ext}`, "");
        }
        if (!fs.existsSync(ctrlDir)) {
            let dir = sfnd + (init_1.isTypeScript ? "/src" : "/templates") + "/controllers";
            fs.copySync(dir, ctrlDir);
        }
        if (!fs.existsSync(localeDir))
            fs.copySync(`${sfnd}/src/locales`, localeDir);
        if (!fs.existsSync(viewDir))
            fs.copySync(`${sfnd}/src/views`, viewDir);
        if (!fs.existsSync(modelDir))
            fs.ensureDirSync(modelDir);
        if (!fs.existsSync(scheduleDir))
            fs.ensureDirSync(scheduleDir);
        if (!fs.existsSync(serviceDir))
            fs.ensureDirSync(serviceDir);
        if (!fs.existsSync(configFile))
            fs.copySync(`${sfnd}/templates/config.${ext}`, configFile);
        if (!fs.existsSync(indexFile))
            fs.copySync(`${sfnd}/templates/index.${ext}`, indexFile);
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
                        program: "${workspaceFolder}/" + (init_1.isTypeScript ? "dist" : "src") + "/index",
                        autoAttachChildProcesses: true
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