import { App } from "webium";
import * as SocketIO from "socket.io";
import * as Mail from "sfn-mail";
import * as OutputBuffer from "sfn-output-buffer";
import * as Logger from "sfn-logger";
import Worker = require("sfn-worker");
import Validator = require("sfn-validator");
import Cache = require("sfn-cache");
import { Server as HttpServer } from "http";
import { Server as HttpsServer, createServer } from "https";
import { Http2SecureServer } from "http2";
import * as fs from "fs";
import * as date from "sfn-date";
import chalk from "chalk";
import { APP_PATH, config, isDevMode } from "../../init";
import { DevWatcher } from "../tools/DevWatcher";

export * from "sfn-scheduler";
export * from "sfn-cookie";
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

/** Whether the current process is the master process. */
export const isMaster: boolean = Worker.isMaster;
/** Whether the current process is a worker process. */
export const isWorker: boolean = Worker.isWorker;

var worker: Worker = null;
var hostnames = config.server.hostname || config.server.host;
var hostname = Array.isArray(hostnames) ? hostnames[0] : hostnames;
var httpServer = config.server.http;
var enableHttp = httpServer ? httpServer.enabled : true;
var httpPort = httpServer ? httpServer.port : config.server.port;
var httpsServer = config.server.https;
var enableHttps = httpsServer.enabled;
var httpsPort = httpsServer.port;
var httpsOptions = httpsServer.options || httpsServer.credentials;
var WS = config.server.websocket || config.server.socket;
var enableWs = WS.enabled && (!enableHttps || !httpsServer.forceRedirect);
var enableWss = WS.enabled && enableHttps;

/** (worker only) The App instance created by **webium** framework. */
export var app: App = null;
/** (worker only) The HTTP server. */
export var http: HttpServer = null;
/** (worker only) The HTTPS server. */
export var https: HttpsServer = null;
/**
 * (worker only) When `config.server.https.http2` is `true`, this object 
 * contains the working http2 server.
 */
export var http2: Http2SecureServer = null;
/** (worker only) The WebSocket created by SocketIO, listens `ws` protocol. */
export var ws: SocketIO.Server = null;
/** (worker only) The WebSocket created by SocketIO, listens `wss` protocol. */
export var wss: SocketIO.Server = null;

if (Worker.isWorker) {
    app = new App({
        cookieSecret: <string>config.session.secret,
        domain: hostnames
    });

    if (enableHttp)
        http = new HttpServer(app.listener);

    if (enableHttps) {
        if (httpsServer.http2) {
            http2 = require("http2").createSecureServer(httpsOptions, app.listener);
        } else {
            https = createServer(httpsOptions, app.listener);
        }
    }

    if (enableWs)
        ws = SocketIO(http, WS.options);

    if (enableWss)
        wss = SocketIO(https, WS.options);
}

export {
    date,
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

    // Start HTTP server.
    if (enableHttp) {
        http.setTimeout(config.server.timeout);
        http.listen(httpPort, (err) => {
            if (err) {
                console.log(err);
                process.exit(1);
            }

            let port: number = http.address()["port"] || httpPort,
                host: string = `${hostname}` + (port != 80 ? `:${port}` : "");

            worker.emit("start-http-server", host);
        });
    }

    // Start HTTPS server.
    if (enableHttps) {
        let server = httpsServer.http2 ? http2 : https;

        if (!httpsServer.http2) {
            https.setTimeout(config.server.timeout);
        }

        server.listen(httpsPort, (err) => {
            if (err) {
                console.log(err);
                process.exit(1);
            }

            let port = https.address()["port"] || httpsPort,
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

    // Listen worker processes, when their servers is started, notify the
    // master and print a message.
    Worker.on("online", worker => {
        var dateTime = chalk.cyan(`[${date("Y-m-d H:i:s.ms")}]`);

        console.log(`${dateTime} Worker <` + chalk.yellow(worker.id) + "> online!");

        worker.on("error", (err: Error) => {
            console.log(err.message);
        }).on("start-http-server", (host: string) => {
            httpCount += 1;

            if (httpCount === config.workers.length) {
                httpCount = 0;

                let dateTime = chalk.cyan(`[${date("Y-m-d H:i:s.ms")}]`),
                    link = chalk.yellow(`http://${host}`);

                console.log(`${dateTime} HTTP Server running at ${link}.`);
            }
        }).on("start-https-server", (host: string) => {
            httpsCount += 1;

            if (httpsCount === config.workers.length) {
                httpsCount = 0;

                let dateTime = chalk.cyan(`[${date("Y-m-d H:i:s.ms")}]`),
                    link = chalk.yellow(`http://${host}`);

                console.log(`${dateTime} HTTP Server running at ${link}.`);
            }
        });
    });

    // folk workers.
    for (let name of config.workers) {
        new Worker(name, !isDevMode);
    }

    let watches = config.watches || [
        "index.ts",
        "config.ts",
        "bootstrap",
        "controllers",
        "locales",
        "models"
    ];

    // Watch for file changes, when a file is modified, reboot the workers.
    if (isDevMode) {
        for (let filename of watches) {
            filename = APP_PATH + "/" + filename;

            fs.exists(filename, exists => {
                if (exists) new DevWatcher(filename);
            });
        }
    }
} else {
    // When the worker is forked and auto-start enabled, start the server 
    // immediately.
    Worker.on("online", _worker => {
        worker = _worker;
        if (config.server.autoStart) {
            startServer();
        }
    });
}