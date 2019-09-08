"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const init_1 = require("../init");
const color_1 = require("../core/tools/internal/color");
let sfnd = path.normalize(__dirname + "/../..");
if (process.cwd() === sfnd)
    process.exit();
console.log(color_1.grey `Initiating...`);
try {
    let tplDir = `${sfnd}/templates`;
    let bootstrap = `${init_1.SRC_PATH}/bootstrap`;
    let creatingFolders = [
        init_1.SRC_PATH,
        bootstrap,
        `${init_1.SRC_PATH}/models`,
        `${init_1.SRC_PATH}/services`
    ];
    let copyingFiles = new Map([
        [`${tplDir}/tsconfig.json`, `${init_1.ROOT_PATH}/tsconfig.json`],
        [`${tplDir}/config.ts`, `${init_1.SRC_PATH}/config.ts`],
        [`${tplDir}/index.ts`, `${init_1.SRC_PATH}/index.ts`],
        [`${tplDir}/assets`, `${init_1.SRC_PATH}/assets`],
        [`${tplDir}/controllers`, `${init_1.SRC_PATH}/controllers`],
        [`${tplDir}/locales`, `${init_1.SRC_PATH}/locales`],
        [`${tplDir}/views`, `${init_1.SRC_PATH}/views`]
    ]);
    let creatingFiles = new Map([
        [`${bootstrap}/index.ts`, "// Custom bootstrap procedures.\n"],
        [`${bootstrap}/http.ts`, "// Custom bootstrap procedures for HTTP server.\n"],
        [`${bootstrap}/websocket.ts`, "// Custom bootstrap procedures for WebSocket server.\n"],
        [`${bootstrap}/cli.ts`, "// Custom CLI commands.\n// See https://github.com/tj/commander.js#command-specific-options\n"]
    ]);
    for (let folder of creatingFolders) {
        if (!fs.existsSync(folder)) {
            fs.ensureDirSync(folder);
        }
    }
    for (let [src, dst] of copyingFiles) {
        if (!fs.existsSync(dst) && fs.existsSync(src)) {
            fs.copySync(src, dst);
        }
    }
    for (let [file, content] of creatingFiles) {
        if (!fs.existsSync(file)) {
            fs.ensureDirSync(path.dirname(file));
            fs.writeFileSync(file, content, "utf8");
        }
    }
    let dir = `${init_1.ROOT_PATH}/.vscode/`, file = `${dir}/launch.json`;
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
    console.log(color_1.green `Initiation succeed!`);
}
catch (err) {
    console.log(color_1.red `Initiation failed!`, String(err));
}
//# sourceMappingURL=init.js.map