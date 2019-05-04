/** Initiate the project after SFN is installed. */
import * as path from "path";
import * as fs from "fs-extra";
import { SRC_PATH, ROOT_PATH } from "../init";
import { red, green, grey } from "../core/tools/internal/color";

let sfnd = path.normalize(__dirname + "/../..");

if (process.cwd() === sfnd)
    process.exit();

// initiate the project.
console.log(grey`Initiating...`);

try {
    let tplDir = `${sfnd}/templates`;
    let bootstrap = `${SRC_PATH}/bootstrap`;
    let creatingFolders = [
        SRC_PATH,
        bootstrap,
        `${SRC_PATH}/models`,
        `${SRC_PATH}/services`
    ];
    let copyingFiles = new Map([
        [`${tplDir}/.env`, `${ROOT_PATH}/.env`],
        [`${tplDir}/tsconfig.json`, `${ROOT_PATH}/tsconfig.json`],
        [`${tplDir}/config.ts`, `${SRC_PATH}/config.ts`],
        [`${tplDir}/index.ts`, `${SRC_PATH}/index.ts`],
        [`${tplDir}/assets`, `${SRC_PATH}/assets`],
        [`${tplDir}/controllers`, `${SRC_PATH}/controllers`],
        [`${tplDir}/locales`, `${SRC_PATH}/locales`],
        [`${tplDir}/views`, `${SRC_PATH}/views`]
    ]);
    let creatingFiles = new Map([
        [`${bootstrap}/index.ts`, "// Custom bootstrap procedures.\n"],
        [`${bootstrap}/http.ts`, "// Custom bootstrap procedures for HTTP server.\n"],
        [`${bootstrap}/websocket.ts`, "// Custom bootstrap procedures for WebSocket server.\n"],
        [`${bootstrap}/cli.ts`, "// Custom CLI commands.\n// See https://github.com/tj/commander.js#command-specific-options\n"]
    ]);

    // try to create needed folders
    for (let folder of creatingFolders) {
        if (!fs.existsSync(folder)) {
            fs.ensureDirSync(folder);
        }
    }

    // try to copy needed files
    for (let [src, dst] of copyingFiles) {
        if (!fs.existsSync(dst) && fs.existsSync(src)) {
            fs.copySync(src, dst);
        }
    }

    // try to create files
    for (let [file, content] of creatingFiles) {
        if (!fs.existsSync(file)) {
            fs.ensureDirSync(path.dirname(file));
            fs.writeFileSync(file, content, "utf8");
        }
    }

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
                    name: "Web Server",
                    program: "${workspaceFolder}/dist/index"
                }
            ]
        }, { spaces: 4 });
    }

    console.log(green`Initiation succeed!`);
} catch (err) {
    console.log(red`Initiation failed!`, String(err));
}