/** Initiate the project after SFN is installed. */
import * as path from "path";
import * as fs from "fs-extra";
import { SRC_PATH, ROOT_PATH } from "../init";
import { red, green, grey } from "../core/tools/functions-inner";

let sfnd = path.normalize(__dirname + "/../../..");

if (process.cwd() != sfnd)
    process.exit();

// initiate the project.
console.log(grey`Initiating...`);

try {
    let tplDir = `${sfnd}/templates`,
        bootstrap = `${SRC_PATH}/bootstrap`,
        assetsDir = `${SRC_PATH}/assets`,
        ctrlDir = `${SRC_PATH}/controllers`,
        localeDir = `${SRC_PATH}/locales`,
        viewDir = `${SRC_PATH}/views`,
        modelDir = `${SRC_PATH}/models`,
        scheduleDir = `${SRC_PATH}/schedules`,
        serviceDir = `${SRC_PATH}/services`,
        configFile = `${SRC_PATH}/config.js`,
        indexFile = `${SRC_PATH}/index.js`,
        envFile = `${ROOT_PATH}/.env`,
        tsconfig = `${SRC_PATH}/tsconfig.json`;

    if (!fs.existsSync(tsconfig))
        fs.copyFileSync(`${tplDir}/tsconfig.json`, tsconfig);

    if (!fs.existsSync(envFile))
        fs.copyFileSync(`${sfnd}/.env`, envFile);

    if (!fs.existsSync(SRC_PATH))
        fs.ensureDirSync(SRC_PATH);

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

    // expose vscode debug configurations
    let dir = `${ROOT_PATH}/.vscode/`,
        file = `${dir}/launch.json`;
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

    console.log(green`Initiation succeed!`);
} catch (err) {
    console.log(red`Initiation failed!`);
}