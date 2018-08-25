"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const init_1 = require("../init");
exports.sfnd = path.normalize(__dirname + "/../../");
exports.ext = init_1.isTypeScript ? "ts" : "js";
if (!fs.existsSync(init_1.SRC_PATH))
    fs.ensureDirSync(init_1.SRC_PATH);
if (!fs.existsSync(`${init_1.SRC_PATH}/assets`))
    fs.copySync(`${exports.sfnd}/src/assets`, `${init_1.SRC_PATH}/assets`);
let bootstrap = `${init_1.SRC_PATH}/bootstrap`;
if (!fs.existsSync(bootstrap)) {
    fs.ensureDirSync(bootstrap);
    fs.writeFileSync(`${bootstrap}/http.${exports.ext}`, "");
    fs.writeFileSync(`${bootstrap}/websocket.${exports.ext}`, "");
}
if (!fs.existsSync(`${init_1.SRC_PATH}/controllers`)) {
    let dir = exports.sfnd + "/src/" + (init_1.isTypeScript ? "controllers" : "cli/templates/controllers");
    fs.copySync(dir, `${init_1.SRC_PATH}/controllers`);
}
if (!fs.existsSync(`${init_1.SRC_PATH}/locales`))
    fs.copySync(`${exports.sfnd}/src/locales`, `${init_1.SRC_PATH}/locales`);
if (!fs.existsSync(`${init_1.SRC_PATH}/views`))
    fs.copySync(`${exports.sfnd}/src/views`, `${init_1.SRC_PATH}/views`);
if (!fs.existsSync(`${init_1.SRC_PATH}/models`))
    fs.ensureDirSync(`${init_1.SRC_PATH}/models`);
if (!fs.existsSync(`${init_1.SRC_PATH}/schedules`))
    fs.ensureDirSync(`${init_1.SRC_PATH}/schedules`);
if (!fs.existsSync(`${init_1.SRC_PATH}/services`))
    fs.ensureDirSync(`${init_1.SRC_PATH}/services`);
if (!fs.existsSync(`${init_1.SRC_PATH}/config.${exports.ext}`))
    fs.copySync(`${exports.sfnd}/src/cli/templates/config.${exports.ext}`, `${init_1.SRC_PATH}/config.${exports.ext}`);
if (!fs.existsSync(`${init_1.SRC_PATH}/index.${exports.ext}`))
    fs.copySync(`${exports.sfnd}/src/cli/templates/index.${exports.ext}`, `${init_1.SRC_PATH}/index.${exports.ext}`);
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
//# sourceMappingURL=init.js.map