"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path_1 = require("path");
const http_1 = require("http");
const https_1 = require("https");
const chalk_1 = require("chalk");
const webium_1 = require("webium");
const SocketIO = require("socket.io");
const date = require("sfn-date");
const Worker = require("sfn-worker");
const init_1 = require("../../init");
const ConfigLoader_1 = require("./ConfigLoader");
const DevWatcher_1 = require("../tools/DevWatcher");
exports.isMaster = Worker.isMaster;
exports.isWorker = Worker.isWorker;
var worker = null;
var hostnames = ConfigLoader_1.config.server.hostname || ConfigLoader_1.config.server.host;
var hostname = Array.isArray(hostnames) ? hostnames[0] : hostnames;
var httpServer = ConfigLoader_1.config.server.http;
var enableHttp = httpServer ? httpServer.enabled : true;
var httpPort = httpServer ? httpServer.port : ConfigLoader_1.config.server.port;
var httpsServer = ConfigLoader_1.config.server.https;
var enableHttps = httpsServer.enabled;
var httpsPort = httpsServer.port;
var httpsOptions = httpsServer.options || httpsServer.credentials;
var WS = ConfigLoader_1.config.server.websocket || ConfigLoader_1.config.server.socket;
var enableWs = WS.enabled && (!enableHttps || !httpsServer.forceRedirect);
var enableWss = WS.enabled && enableHttps;
exports.app = null;
exports.http = null;
exports.https = null;
exports.http2 = null;
exports.ws = null;
exports.wss = null;
if (Worker.isWorker) {
    exports.app = new webium_1.App({
        cookieSecret: ConfigLoader_1.config.session.secret,
        domain: hostnames
    });
    if (enableHttp)
        exports.http = new http_1.Server(exports.app.listener);
    if (enableHttps) {
        if (httpsServer.http2) {
            exports.http2 = require("http2").createSecureServer(httpsOptions, exports.app.listener);
        }
        else {
            exports.https = https_1.createServer(httpsOptions, exports.app.listener);
        }
    }
    if (enableWs)
        exports.ws = SocketIO(exports.http, WS.options);
    if (enableWss)
        exports.wss = SocketIO(exports.https, WS.options);
}
function startServer() {
    if (Worker.isMaster) {
        throw new Error("The server can only be run in a worker process.");
    }
    require("./ControllerLoader");
    const { handleHttpAuth } = require("../middleware/HttpAuthHandler");
    const { handleHttpDB } = require("../middleware/HttpDBHandler");
    const { handleHttpInit } = require("../middleware/HttpInitHandler");
    const { handleHttpSession } = require("../middleware/HttpSessionHandler");
    const { redirectHttps } = require("../middleware/HttpsRedirector");
    const { handleStatic } = require("../middleware/HttpStaticHandler");
    const { handleHttpXML } = require("../middleware/HttpXMLHandler");
    const { handleHttpRoute } = require("../middleware/HttpRouteHandler");
    const { handleWebSocketAuth } = require("../middleware/WebSocketAuthHandler");
    const { handleWebSocketCookie } = require("../middleware/WebSocketCookieHandler");
    const { handleWebSocketDB } = require("../middleware/WebSocketDBHandler");
    const { handleWebSocketProps } = require("../middleware/WebSocketPropsHandler");
    const { handleWebSocketSession } = require("../middleware/WebSocketSessionHandler");
    const { handleWebSocketEvent } = require("../middleware/WebSocketEventHandler");
    let initWebSocketServer = (io) => {
        handleWebSocketProps(io);
        handleWebSocketCookie(io);
        handleWebSocketSession(io);
        handleWebSocketDB(io);
        handleWebSocketAuth(io);
    };
    redirectHttps(exports.app);
    handleHttpInit(exports.app);
    handleStatic(exports.app);
    handleHttpSession(exports.app);
    handleHttpXML(exports.app);
    handleHttpDB(exports.app);
    handleHttpAuth(exports.app);
    let file = init_1.APP_PATH + "/bootstrap/http.js";
    if (fs.existsSync(file))
        require(file);
    handleHttpRoute(exports.app);
    if (enableHttp) {
        exports.http.setTimeout(ConfigLoader_1.config.server.timeout);
        exports.http.listen(httpPort, (err) => {
            if (err) {
                console.log(err);
                process.exit(1);
            }
            let port = exports.http.address()["port"] || httpPort, host = `${hostname}` + (port != 80 ? `:${port}` : "");
            worker.emit("start-http-server", host);
        });
    }
    if (enableHttps) {
        let server = httpsServer.http2 ? exports.http2 : exports.https;
        if (!httpsServer.http2) {
            exports.https.setTimeout(ConfigLoader_1.config.server.timeout);
        }
        server.listen(httpsPort, (err) => {
            if (err) {
                console.log(err);
                process.exit(1);
            }
            let port = exports.https.address()["port"] || httpsPort, host = `${hostname}` + (port != 443 ? `:${port}` : "");
            worker.emit("start-https-server", host);
        });
    }
    if (enableWs)
        initWebSocketServer(exports.ws);
    if (enableWss)
        initWebSocketServer(exports.wss);
    file = init_1.APP_PATH + "/bootstrap/websocket.js";
    if ((enableWs || enableWss) && fs.existsSync(file))
        require(file);
    if (enableWs)
        handleWebSocketEvent(exports.ws);
    if (enableWss)
        handleWebSocketEvent(exports.wss);
}
exports.startServer = startServer;
if (Worker.isMaster) {
    if (!ConfigLoader_1.config.workers || ConfigLoader_1.config.workers.length === 0) {
        throw new Error("There should be at least one worker configured.");
    }
    let httpCount = 0, httpsCount = 0;
    Worker.on("online", worker => {
        var dateTime = chalk_1.default.cyan(`[${date("Y-m-d H:i:s.ms")}]`);
        console.log(`${dateTime} Worker <` + chalk_1.default.yellow(worker.id) + "> online!");
        worker.on("error", (err) => {
            console.log(err.message);
        }).on("start-http-server", (host) => {
            httpCount += 1;
            if (httpCount === ConfigLoader_1.config.workers.length) {
                httpCount = 0;
                let dateTime = chalk_1.default.cyan(`[${date("Y-m-d H:i:s.ms")}]`), link = chalk_1.default.yellow(`http://${host}`);
                console.log(`${dateTime} HTTP Server running at ${link}.`);
            }
        }).on("start-https-server", (host) => {
            httpsCount += 1;
            if (httpsCount === ConfigLoader_1.config.workers.length) {
                httpsCount = 0;
                let dateTime = chalk_1.default.cyan(`[${date("Y-m-d H:i:s.ms")}]`), link = chalk_1.default.yellow(`http://${host}`);
                console.log(`${dateTime} HTTP Server running at ${link}.`);
            }
        });
    });
    for (let name of ConfigLoader_1.config.workers) {
        new Worker(name, !ConfigLoader_1.isDevMode);
    }
    let watches = ConfigLoader_1.config.watches || [
        "index.ts",
        "config.ts",
        "bootstrap",
        "controllers",
        "locales",
        "models"
    ];
    if (ConfigLoader_1.isDevMode) {
        for (let filename of watches) {
            if (path_1.extname(filename) == ".ts")
                filename = filename.slice(0, -3) + ".js";
            filename = init_1.APP_PATH + "/" + filename;
            fs.exists(filename, exists => {
                if (exists)
                    new DevWatcher_1.DevWatcher(filename);
            });
        }
    }
}
else {
    Worker.on("online", _worker => {
        worker = _worker;
        if (ConfigLoader_1.config.server.autoStart) {
            startServer();
        }
    });
}
//# sourceMappingURL=index.js.map