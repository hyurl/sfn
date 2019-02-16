"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const http_1 = require("http");
const https_1 = require("https");
const webium_1 = require("webium");
const SocketIO = require("socket.io");
const chalk_1 = require("chalk");
const init_1 = require("../../init");
const load_config_1 = require("./load-config");
const functions_inner_1 = require("../tools/functions-inner");
const Service_1 = require("../tools/Service");
exports.router = null;
exports.http = null;
exports.ws = null;
const tryImport = functions_inner_1.createImport(require);
let hostnames = load_config_1.config.server.hostname, httpServer = load_config_1.config.server.http, httpPort = httpServer.port, WS = load_config_1.config.server.websocket;
if (!init_1.isCli) {
    exports.router = new webium_1.App({
        cookieSecret: load_config_1.config.session.secret,
        domain: hostnames
    });
    switch (httpServer.type) {
        case "http":
            exports.http = new http_1.Server(exports.router.listener);
            break;
        case "https":
            exports.http = https_1.createServer(httpServer.options, exports.router.listener);
            break;
        case "http2":
            exports.http = require("http2").createSecureServer(httpServer.options, exports.router.listener);
            break;
    }
    if (WS.enabled) {
        if (!WS.port)
            exports.ws = SocketIO(exports.http, WS.options);
        else
            exports.ws = SocketIO(WS.port, WS.options);
    }
    let workerBootstrap = init_1.APP_PATH + "/bootstrap/worker";
    functions_inner_1.moduleExists(workerBootstrap) && tryImport(workerBootstrap);
    require("../handlers/worker-shutdown");
    if (load_config_1.config.hotReloading) {
        app.models.watch();
        app.services.watch();
        app.controllers.watch().on("add", tryImport).on("change", tryImport);
    }
}
function startServer(port) {
    require("../handlers/https-redirector");
    require("../handlers/http-init");
    require("../handlers/http-static");
    require("../handlers/http-xml");
    require("../handlers/http-session");
    require("../handlers/http-db");
    require("../handlers/http-auth");
    let httpBootstrap = init_1.APP_PATH + "/bootstrap/http";
    functions_inner_1.moduleExists(httpBootstrap) && tryImport(httpBootstrap);
    if (WS.enabled) {
        let wsBootstrap = init_1.APP_PATH + "/bootstrap/websocket";
        functions_inner_1.moduleExists(wsBootstrap) && tryImport(wsBootstrap);
    }
    if (typeof exports.http["setTimeout"] == "function") {
        exports.http["setTimeout"](load_config_1.config.server.http.timeout);
    }
    exports.http.on("error", (err) => {
        console.log(functions_inner_1.red `${err.toString()}`);
        if (err.message.includes("listen")) {
            process.exit(1);
        }
    }).listen(port || httpPort, async () => {
        try {
            await Service_1.default.cache.sync();
            if (load_config_1.config.server.rpc && Object.keys(load_config_1.config.server.rpc).length) {
                for (let name in load_config_1.config.server.rpc) {
                    await connectRPC(name);
                }
            }
        }
        catch (e) { }
        require("../bootstrap/load-controller");
        if (typeof process.send == "function") {
            process.send("ready");
        }
        else {
            console.log(functions_inner_1.green `HTTP server running at ${chalk_1.default.yellow(load_config_1.baseUrl)}.`);
        }
    });
}
exports.startServer = startServer;
async function serveRPC(name) {
    let _a = load_config_1.config.server.rpc[name], { modules } = _a, options = tslib_1.__rest(_a, ["modules"]);
    let service = await app.services.serve(options);
    for (let mod of modules) {
        service.register(mod);
    }
    console.log(functions_inner_1.green `RPC server [${name}] started.`);
}
exports.serveRPC = serveRPC;
async function connectRPC(name) {
    let _a = load_config_1.config.server.rpc[name], { modules } = _a, options = tslib_1.__rest(_a, ["modules"]);
    let service = await app.services.connect(options);
    for (let mod of modules) {
        service.register(mod);
    }
    console.log(functions_inner_1.green `RPC server [${name}] connected.`);
}
exports.connectRPC = connectRPC;
async function useRPC(name) {
    await serveRPC(name);
    await connectRPC(name);
}
exports.useRPC = useRPC;
app.serve = startServer;
app.serveRPC = serveRPC;
app.connectRPC = connectRPC;
app.useRPC = useRPC;
//# sourceMappingURL=index.js.map