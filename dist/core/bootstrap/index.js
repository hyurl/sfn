"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const webium_1 = require("webium");
const SocketIO = require("socket.io");
const Mail = require("sfn-mail");
exports.Mail = Mail;
const OutputBuffer = require("sfn-output-buffer");
exports.OutputBuffer = OutputBuffer;
const Logger = require("sfn-logger");
exports.Logger = Logger;
const Worker = require("sfn-worker");
exports.Worker = Worker;
const Validator = require("sfn-validator");
exports.Validator = Validator;
const Cache = require("sfn-cache");
exports.Cache = Cache;
const http_1 = require("http");
const https_1 = require("https");
const fs = require("fs");
const date = require("sfn-date");
exports.date = date;
const chalk_1 = require("chalk");
const init_1 = require("../../init");
const DevWatcher_1 = require("../tools/DevWatcher");
exports.DevWatcher = DevWatcher_1.DevWatcher;
tslib_1.__exportStar(require("sfn-scheduler"), exports);
tslib_1.__exportStar(require("sfn-cookie"), exports);
tslib_1.__exportStar(require("../../init"), exports);
tslib_1.__exportStar(require("../tools/functions"), exports);
tslib_1.__exportStar(require("../tools/HttpError"), exports);
tslib_1.__exportStar(require("../tools/SocketError"), exports);
tslib_1.__exportStar(require("../tools/Service"), exports);
tslib_1.__exportStar(require("../tools/TemplateEngine"), exports);
tslib_1.__exportStar(require("../tools/MarkdownParser"), exports);
tslib_1.__exportStar(require("../controllers/HttpController"), exports);
tslib_1.__exportStar(require("../controllers/WebSocketController"), exports);
exports.isMaster = Worker.isMaster;
exports.isWorker = Worker.isWorker;
var worker = null;
var hostnames = init_1.config.server.hostname || init_1.config.server.host;
var hostname = Array.isArray(hostnames) ? hostnames[0] : hostnames;
var enableHttp = init_1.config.server.http ? init_1.config.server.http.enabled : true;
var httpPort = init_1.config.server.http ? init_1.config.server.http.port : init_1.config.server.port;
var enableHttps = init_1.config.server.https.enabled;
var httpsPort = init_1.config.server.https.port;
var WS = init_1.config.server.websocket || init_1.config.server.socket;
var enableWs = WS.enabled && (!enableHttps || !init_1.config.server.https.forceRedirect);
var enableWss = WS.enabled && enableHttps;
exports.app = null;
exports.http = null;
exports.https = null;
exports.ws = null;
exports.wss = null;
if (Worker.isWorker) {
    exports.app = new webium_1.App({
        cookieSecret: init_1.config.session.secret,
        domain: hostnames
    });
    if (enableHttp)
        exports.http = new http_1.Server(exports.app.listener);
    if (enableHttps)
        exports.https = https_1.createServer(init_1.config.server.https.credentials, exports.app.listener);
    if (enableWs)
        exports.ws = SocketIO(exports.http, WS.options);
    if (enableWss)
        exports.wss = SocketIO(exports.https, WS.options);
}
function startServer() {
    if (Worker.isMaster) {
        throw new Error("The server can only be run in a worker process.");
    }
    require("../bootstrap/ControllerLoader");
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
        exports.http.setTimeout(init_1.config.server.timeout);
        exports.http.listen(init_1.config.server.port, (err) => {
            if (err) {
                console.log(err);
                process.exit(1);
            }
            let port = exports.http.address()["port"] || init_1.config.server.port, host = `${hostname}` + (port != 80 ? `:${port}` : "");
            worker.emit("start-http-server", host);
        });
    }
    if (enableHttps) {
        exports.https.setTimeout(init_1.config.server.timeout);
        exports.https.listen(httpsPort, (err) => {
            if (err) {
                console.log(err);
                process.exit(1);
            }
            let port = exports.https.address()["port"] || init_1.config.server.port, host = `${hostname}` + (port != 443 ? `:${port}` : "");
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
    if (!init_1.config.workers || init_1.config.workers.length === 0) {
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
            if (httpCount === init_1.config.workers.length) {
                httpCount = 0;
                let dateTime = chalk_1.default.cyan(`[${date("Y-m-d H:i:s.ms")}]`), link = chalk_1.default.yellow(`http://${host}`);
                console.log(`${dateTime} HTTP Server running at ${link}.`);
            }
        }).on("start-https-server", (host) => {
            httpsCount += 1;
            if (httpsCount === init_1.config.workers.length) {
                httpsCount = 0;
                let dateTime = chalk_1.default.cyan(`[${date("Y-m-d H:i:s.ms")}]`), link = chalk_1.default.yellow(`http://${host}`);
                console.log(`${dateTime} HTTP Server running at ${link}.`);
            }
        });
    });
    for (let name of init_1.config.workers) {
        new Worker(name, !init_1.isDevMode);
    }
    let WatchFolders = ["bootstrap", "controllers", "locales", "models"];
    if (init_1.isDevMode) {
        new DevWatcher_1.DevWatcher(init_1.APP_PATH + "/config.js");
        new DevWatcher_1.DevWatcher(init_1.APP_PATH + "/index.js");
        for (let folder of WatchFolders) {
            let dir = init_1.APP_PATH + "/" + folder;
            fs.exists(dir, exists => {
                if (exists) {
                    new DevWatcher_1.DevWatcher(dir);
                }
            });
        }
    }
}
else {
    Worker.on("online", _worker => {
        worker = _worker;
        if (init_1.config.server.autoStart) {
            startServer();
        }
    });
}
//# sourceMappingURL=index.js.map