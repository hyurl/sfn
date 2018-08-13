/** Initiate the project after SFN is installed. */
import * as path from "path";
import * as fs from "fs-extra";
import { SRC_PATH, isTypeScript } from "../init";

export var sfnd = path.normalize(__dirname + "/../../");
export var ext = isTypeScript ? "ts" : "js";

if (!fs.existsSync(SRC_PATH))
    fs.ensureDirSync(SRC_PATH);

if (!fs.existsSync(`${SRC_PATH}/assets`))
    fs.copySync(`${sfnd}/src/assets`, `${SRC_PATH}/assets`);

let bootstrap = `${SRC_PATH}/bootstrap`;
if (!fs.existsSync(bootstrap)) {
    fs.ensureDirSync(bootstrap);
    fs.writeFileSync(`${bootstrap}/http.${ext}`, "");
    fs.writeFileSync(`${bootstrap}/websocket.${ext}`, "");
}

if (!fs.existsSync(`${SRC_PATH}/controllers`)) {
    let dir = sfnd + "/src/" + (isTypeScript ? "controllers" : "cli/templates/controllers");
    fs.copySync(dir, `${SRC_PATH}/controllers`);
}

if (!fs.existsSync(`${SRC_PATH}/locales`))
    fs.copySync(`${sfnd}/src/locales`, `${SRC_PATH}/locales`);

if (!fs.existsSync(`${SRC_PATH}/views`))
    fs.copySync(`${sfnd}/src/views`, `${SRC_PATH}/views`);

if (!fs.existsSync(`${SRC_PATH}/models`))
    fs.ensureDirSync(`${SRC_PATH}/models`);

if (!fs.existsSync(`${SRC_PATH}/schedules`))
    fs.ensureDirSync(`${SRC_PATH}/schedules`);

if (!fs.existsSync(`${SRC_PATH}/services`))
    fs.ensureDirSync(`${SRC_PATH}/services`);

if (!fs.existsSync(`${SRC_PATH}/config.${ext}`))
    fs.copySync(`${sfnd}/src/cli/templates/config.${ext}`, `${SRC_PATH}/config.${ext}`);

if (!fs.existsSync(`${SRC_PATH}/index.${ext}`))
    fs.copySync(`${sfnd}/src/cli/templates/index.${ext}`, `${SRC_PATH}/index.${ext}`);