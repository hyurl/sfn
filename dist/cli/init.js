"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const init_1 = require("../init");
var isTs = fs.existsSync(init_1.ROOT_PATH + "/tsconfig.json");
exports.sfnd = path.normalize(__dirname + "/../../");
exports.ext = isTs ? "ts" : "js";
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
    let dir = exports.sfnd + "/src/" + (isTs ? "controllers" : "cli/templates/controllers");
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
//# sourceMappingURL=init.js.map