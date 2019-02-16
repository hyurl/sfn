"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const functions_inner_1 = require("../tools/functions-inner");
const load_config_1 = require("./load-config");
app.serveRPC = serveRPC;
async function serveRPC(name) {
    let _a = load_config_1.config.server.rpc[name], { modules } = _a, options = tslib_1.__rest(_a, ["modules"]);
    let service = await app.services.serve(options);
    for (let mod of modules) {
        service.register(mod);
    }
    console.log(functions_inner_1.green `RPC server [${name}] started.`);
}
async function connectRPC(name) {
    let timer;
    try {
        let _a = load_config_1.config.server.rpc[name], { modules } = _a, options = tslib_1.__rest(_a, ["modules"]);
        let service = await app.services.connect(options);
        for (let mod of modules) {
            service.register(mod);
        }
        timer && clearTimeout(timer);
        console.log(functions_inner_1.green `RPC server [${name}] connected.`);
    }
    catch (err) {
        timer = setTimeout(() => {
            connectRPC(name);
        }, load_config_1.config.server.rpc[name].timeout || 5000);
    }
}
exports.connectRPC = connectRPC;
//# sourceMappingURL=rpc-support.js.map