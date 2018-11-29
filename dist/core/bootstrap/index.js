"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const http_1 = require("http");
const https_1 = require("https");
const webium_1 = require("webium");
const SocketIO = require("socket.io");
const chalk_1 = require("chalk");
const init_1 = require("../../init");
const ConfigLoader_1 = require("./ConfigLoader");
const DevHotReloader_1 = require("../tools/DevHotReloader");
const functions_inner_1 = require("../tools/functions-inner");
exports.app = null;
exports.http = null;
exports.ws = null;
let hostnames = ConfigLoader_1.config.server.hostname, httpServer = ConfigLoader_1.config.server.http, httpPort = httpServer.port, WS = ConfigLoader_1.config.server.websocket, serverStarted = false;
function startServer() {
    if (serverStarted) {
        throw new Error("Server already started.");
    }
    serverStarted = true;
    require("../handlers/https-redirector");
    require("../handlers/http-init");
    require("../handlers/http-static");
    require("../handlers/http-xml");
    require("../handlers/http-session");
    require("../handlers/http-db");
    require("../handlers/http-auth");
    let httpBootstrap = init_1.APP_PATH + "/bootstrap/http.js";
    fs.existsSync(httpBootstrap) && require(httpBootstrap);
    require("../bootstrap/ControllerLoader");
    if (WS.enabled) {
        require("../handlers/websocket-event");
        let wsBootstrap = init_1.APP_PATH + "/bootstrap/websocket.js";
        fs.existsSync(wsBootstrap) && require(wsBootstrap);
    }
    if (typeof exports.http["setTimeout"] == "function") {
        exports.http["setTimeout"](ConfigLoader_1.config.server.timeout);
    }
    exports.http.on("error", (err) => {
        console.log(functions_inner_1.red `${err.toString()}`);
        if (err.message.includes("listen")) {
            process.exit(1);
        }
    }).listen(httpPort, () => {
        if (typeof process.send == "function") {
            process.send("ready");
        }
        else {
            console.log(functions_inner_1.green `HTTP Server running at ${chalk_1.default.yellow(ConfigLoader_1.baseUrl)}.`);
        }
    });
}
exports.startServer = startServer;
if (!init_1.isCli) {
    exports.app = new webium_1.App({
        cookieSecret: ConfigLoader_1.config.session.secret,
        domain: hostnames
    });
    switch (httpServer.type) {
        case "http":
            exports.http = new http_1.Server(exports.app.listener);
            break;
        case "https":
            exports.http = https_1.createServer(httpServer.options, exports.app.listener);
            break;
        case "http2":
            exports.http = require("http2").createSecureServer(httpServer.options, exports.app.listener);
            break;
    }
    if (WS.enabled) {
        if (!WS.port)
            exports.ws = SocketIO(exports.http, WS.options);
        else
            exports.ws = SocketIO(WS.port, WS.options);
    }
    require("../handlers/worker-shutdown");
    let workerBootstrap = init_1.APP_PATH + "/bootstrap/worker.js";
    fs.existsSync(workerBootstrap) && require(workerBootstrap);
    if (ConfigLoader_1.config.server.autoStart) {
        startServer();
    }
    if (ConfigLoader_1.isDevMode && ConfigLoader_1.config.hotReloading) {
        for (let dirname of ConfigLoader_1.config.controllers) {
            dirname = path.resolve(init_1.APP_PATH, dirname);
            fs.exists(dirname, exists => {
                if (exists)
                    new DevHotReloader_1.DevHotReloader(dirname);
            });
        }
    }
}
//# sourceMappingURL=index.js.map