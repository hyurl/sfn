"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const http_1 = require("http");
const https_1 = require("https");
const chalk_1 = require("chalk");
const webium_1 = require("webium");
const SocketIO = require("socket.io");
const Worker = require("sfn-worker");
const without = require("lodash/without");
const dgramx_1 = require("dgramx");
const init_1 = require("../../init");
const ConfigLoader_1 = require("./ConfigLoader");
const DevWatcher_1 = require("../tools/DevWatcher");
const DevHotReloader_1 = require("../tools/DevHotReloader");
const functions_inner_1 = require("../tools/functions-inner");
exports.isMaster = Worker.isMaster;
exports.isWorker = Worker.isWorker;
exports.worker = null;
exports.app = null;
exports.http = null;
exports.ws = null;
exports.dgram = null;
let hostnames = ConfigLoader_1.config.server.hostname, hostname = Array.isArray(hostnames) ? hostnames[0] : hostnames, httpServer = ConfigLoader_1.config.server.http, httpPort = httpServer.port, WS = ConfigLoader_1.config.server.websocket, workers = ConfigLoader_1.config.workers, serverStarted = false;
function startServer() {
    if (Worker.isMaster) {
        throw new Error("The server can only be run in a worker process.");
    }
    else if (serverStarted) {
        throw new Error("Server already started.");
    }
    serverStarted = true;
    require("../handlers/worker/https-redirector");
    require("../handlers/worker/http-init");
    require("../handlers/worker/http-static");
    require("../handlers/worker/http-xml");
    require("../handlers/worker/http-session");
    require("../handlers/worker/http-db");
    require("../handlers/worker/http-auth");
    let httpBootstrap = init_1.APP_PATH + "/bootstrap/http.js";
    fs.existsSync(httpBootstrap) ? require(httpBootstrap) : null;
    require("../bootstrap/ControllerLoader");
    if (WS.enabled) {
        require("../handlers/worker/websocket-event");
        let wsBootstrap = init_1.APP_PATH + "/bootstrap/websocket.js";
        fs.existsSync(wsBootstrap) ? require(wsBootstrap) : null;
    }
    if (typeof exports.http["setTimeout"] == "function") {
        exports.http["setTimeout"](ConfigLoader_1.config.server.timeout);
    }
    exports.http.on("error", (err) => {
        console.log(functions_inner_1.red `${err.toString()}`);
    }).listen(httpPort, (err) => {
        if (!exports.worker.rebootTimes) {
            let port = exports.http.address()["port"] || httpPort, host = hostname + (port == 80 || port == 443 ? "" : ":" + port);
            exports.worker.emit("server-started", host);
        }
        else {
            exports.worker.emit("server-restarted");
        }
    });
}
exports.startServer = startServer;
if (Worker.isMaster && !init_1.isCli) {
    if (workers.length === 0) {
        throw new Error("No worker was configured.");
    }
    if (ConfigLoader_1.config.server.dgram.enabled) {
        exports.dgram = new dgramx_1.Socket("udp4");
        exports.dgram.bind(ConfigLoader_1.config.server.dgram.port);
    }
    require("../handlers/master/worker-list");
    require("../handlers/master/worker-reload");
    require("../handlers/master/service-stop");
    let masterBootstrap = init_1.APP_PATH + "/bootstrap/master.js";
    fs.existsSync(masterBootstrap) ? require(masterBootstrap) : null;
    let httpCount = 0;
    Worker.on("online", worker => {
        console.log(functions_inner_1.green `Worker <` + chalk_1.default.yellow(worker.id) + "> online!");
        worker.on("error", (err) => {
            console.error(functions_inner_1.red `${err.toString()}`);
        }).on("server-started", (host) => {
            httpCount++;
            !workers.includes(worker.id) ? workers.push(worker.id) : null;
            if (httpCount === workers.length) {
                httpCount = 0;
                let type = ConfigLoader_1.config.server.http.type, link = (type == "http2" ? "https" : type) + "://" + host, msg = functions_inner_1.green `HTTP Server running at ${chalk_1.default.yellow(link)}.`, argv = process.argv[2] || "", matches = argv.match(/--udp-client=(.+):(.+)/);
                if (exports.dgram && matches) {
                    let addr = matches[1], port = parseInt(matches[2]);
                    exports.dgram.to(addr, port).emit("service-started", msg);
                }
                else if (!matches) {
                    console.log(msg);
                }
            }
        });
    }).on("exit", (worker) => {
        workers = without(workers, worker.id);
    });
    for (let name of workers) {
        new Worker(name, !ConfigLoader_1.isDevMode);
    }
    if (ConfigLoader_1.isDevMode && !ConfigLoader_1.config.hotReloading) {
        for (let filename of ConfigLoader_1.config.watches) {
            if (path.extname(filename) == ".ts")
                filename = filename.slice(0, -3) + ".js";
            filename = path.resolve(init_1.APP_PATH, filename);
            fs.exists(filename, exists => {
                if (exists)
                    new DevWatcher_1.DevWatcher(filename);
            });
        }
    }
}
else if (exports.isWorker) {
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
    Worker.on("online", _worker => {
        exports.worker = _worker;
        require("../handlers/worker/worker-reload");
        require("../handlers/worker/worker-stop");
        let workerBootstrap = init_1.APP_PATH + "/bootstrap/worker.js";
        fs.existsSync(workerBootstrap) ? require(workerBootstrap) : null;
        if (ConfigLoader_1.config.server.autoStart) {
            startServer();
        }
    });
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