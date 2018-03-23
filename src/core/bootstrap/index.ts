import { App } from "webium";
import * as SocketIO from "socket.io";
import * as trimmer from "string-trimmer";
import Mail = require("sfn-mail");
import OutputBuffer = require("sfn-output-buffer");
import Logger = require("sfn-logger");
import Worker = require("sfn-worker");
import Validator = require("sfn-validator");
import Cache = require("sfn-cache");
import { Server as HttpServer } from "http";
import { Server as HttpsServer, createServer } from "https";
import * as fs from "fs";
import * as date from "sfn-date";
import { APP_PATH, config } from "../../init";
import { DevWatcher } from "../tools/DevWatcher";

export * from "sfn-scheduler";
export * from "../../init";
export * from "../tools/interfaces";
export * from "../tools/functions";
export * from "../tools/HttpError";
export * from "../tools/SocketError";
export * from "../tools/Service";
export * from "../tools/TemplateEngine";
export * from "../tools/MarkdownParser";
export * from "../controllers/HttpController";
export * from "../controllers/WebSocketController";

export const isMaster: boolean = Worker.isMaster;
export const isWorker: boolean = Worker.isWorker;

var worker: Worker = null;
var enableHttps = config.server.https.enabled;
var httpsPort = config.server.https.port;
var enableWs = config.server.socket.enabled && (!enableHttps || !config.server.https.forceRedirect);
var enableWss = config.server.socket.enabled && enableHttps;

export var app: App = null;
/** (worker only) The HTTP server. */
export var http: HttpServer = null;
/** (worker only) The HTTPS server. */
export var https: HttpsServer = null;
/** (worker only) The WebSocket created by SocketIO, listens `ws` protocol. */
export var ws: SocketIO.Server = null;
/** (worker only) The WebSocket created by SocketIO, listens `wss` protocol. */
export var wss: SocketIO.Server = null;

if (Worker.isWorker) {
    app = new App({ cookieSecret: config.session.secret });
    http = new HttpServer(app.listener);

    if (enableHttps)
        https = createServer(config.server.https.credentials, app.listener);

    if (enableWs)
        ws = SocketIO(http, config.server.socket.options);

    if (enableWss)
        wss = SocketIO(https, config.server.socket.options);
}

export {
    date,
    trimmer,
    Mail,
    OutputBuffer,
    Logger,
    Worker,
    Validator,
    Cache,
    DevWatcher
}

/**
 * (worker only) Starts HTTP server and socket server (if enabled).
 */
export function startServer() {
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

    let initWebSocketServer = (io: SocketIO.Server): void => {
        handleWebSocketProps(io);
        handleWebSocketCookie(io);
        handleWebSocketSession(io);
        handleWebSocketDB(io);
        handleWebSocketAuth(io);
    };

    redirectHttps(app);
    handleHttpInit(app);
    handleStatic(app);
    handleHttpSession(app);
    handleHttpXML(app);
    handleHttpDB(app);
    handleHttpAuth(app);

    // Load user-defined bootstrap procedures.
    let file = APP_PATH + "/bootstrap/http.js";
    if (fs.existsSync(file))
        require(file);

    handleHttpRoute(app);

    let hostname: string = Array.isArray(config.server.host)
        ? config.server.host[0]
        : config.server.host;

    // Start HTTP server.
    http.setTimeout(config.server.timeout);
    http.listen(<number>config.server.port, (err) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }

        let port: number = http.address().port,
            host: string = `${hostname}` + (port != 80 ? `:${port}` : "");
        worker.emit("start-http-server", host);
    });

    // Start HTTPS server.
    if (enableHttps) {
        https.setTimeout(config.server.timeout || 120000);
        https.listen(httpsPort, (err) => {
            if (err) {
                console.log(err);
                process.exit(1);
            }

            let port = https.address().port,
                host = `${hostname}` + (port != 443 ? `:${port}` : "");
            worker.emit("start-https-server", host);
        });
    }

    // Start WebSocket server.
    if (enableWs)
        initWebSocketServer(ws);
    if (enableWss)
        initWebSocketServer(wss);

    // Load user-defined bootstrap procedures.
    file = APP_PATH + "/bootstrap/websocket.js";
    if ((enableWs || enableWss) && fs.existsSync(file))
        require(file);

    if (enableWs)
        handleWebSocketEvent(ws);
    if (enableWss)
        handleWebSocketEvent(wss);
}

if (Worker.isMaster) {
    // Master process, folk workers.

    if (!config.workers || config.workers.length === 0) {
        throw new Error("There should be at least one worker configured.");
    }

    let httpCount = 0,
        httpsCount = 0;

    Worker.on("online", worker => {
        var dateTime = `[${date("Y-m-d H:i:s.ms")}]`.cyan;

        console.log(`${dateTime} Worker <` + worker.id.yellow + "> online!");

        worker.on("error", (err: Error) => {
            console.log(err.message);
        }).on("start-http-server", (host: string) => {
            httpCount += 1;

            if (httpCount === config.workers.length) {
                httpCount = 0;

                let dateTime = `[${date("Y-m-d H:i:s.ms")}]`.cyan,
                    link = `http://${host}`.yellow;

                console.log(`${dateTime} HTTP Server running at ${link}.`);
            }
        }).on("start-https-server", (host: string) => {
            httpsCount += 1;

            if (httpsCount === config.workers.length) {
                httpsCount = 0;

                let dateTime = `[${date("Y-m-d H:i:s.ms")}]`.cyan,
                    link = `http://${host}`.yellow;

                console.log(`${dateTime} HTTP Server running at ${link}.`);
            }
        });
    });

    // folk workers.
    for (let name of config.workers) {
        new Worker(name, config.env !== "dev");
    }

    let WatchFolders = ["bootstrap", "controllers", "locales", "models"];

    if (config.env === "dev") {
        new DevWatcher(APP_PATH + "/config.js");
        new DevWatcher(APP_PATH + "/index.js");

        for (let folder of WatchFolders) {
            let dir = APP_PATH + "/" + folder;
            fs.exists(dir, exists => {
                if (exists) {
                    new DevWatcher(dir);
                }
            });
        }
    }
} else {
    Worker.on("online", _worker => {
        worker = _worker;
        if (config.server.autoStart) {
            startServer();
        }
    });
}