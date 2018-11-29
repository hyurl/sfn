import * as fs from "fs";
import * as path from "path";
import { Server as HttpServer } from "http";
import { Server as HttpsServer, createServer } from "https";
import { Http2SecureServer } from "http2";
import { App } from "webium";
import * as SocketIO from "socket.io";
import chalk from "chalk";
import { APP_PATH, isCli } from "../../init";
import { config, isDevMode, baseUrl } from "./ConfigLoader";
import { DevHotReloader } from "../tools/DevHotReloader";
import { red, green } from "../tools/functions-inner";

/** (worker only) The App instance created by **webium** framework. */
export var app: App = null;
/** (worker only) The HTTP server. */
export var http: HttpServer | HttpsServer | Http2SecureServer = null;
/** (worker only) The WebSocket server created by **SocketIO**. */
export var ws: SocketIO.Server = null;

let hostnames = config.server.hostname,
    httpServer = config.server.http,
    httpPort = httpServer.port,
    WS = config.server.websocket,
    serverStarted = false;

/**
 * (worker only) Starts HTTP server and socket server (if enabled).
 */
export function startServer() {
    if (serverStarted) {
        throw new Error("Server already started.");
    }

    serverStarted = true;

    // load HTTP middleware
    require("../handlers/https-redirector");
    require("../handlers/http-init");
    require("../handlers/http-static");
    require("../handlers/http-xml");
    require("../handlers/http-session");
    require("../handlers/http-db");
    require("../handlers/http-auth");

    // Load user-defined bootstrap procedures.
    let httpBootstrap = APP_PATH + "/bootstrap/http.js";
    fs.existsSync(httpBootstrap) && require(httpBootstrap);

    // load controllers
    require("../bootstrap/ControllerLoader");

    // load HTTP route handler
    // require("../handlers/http-route");

    if (WS.enabled) {
        // load WebSocket event handler
        require("../handlers/websocket-event");

        // Load user-defined bootstrap procedures.
        let wsBootstrap = APP_PATH + "/bootstrap/websocket.js";
        fs.existsSync(wsBootstrap) && require(wsBootstrap);
    }

    // Start HTTP server.
    if (typeof http["setTimeout"] == "function") {
        http["setTimeout"](config.server.timeout);
    }

    http.on("error", (err: Error) => {
        console.log(red`${err.toString()}`);
        if (err.message.includes("listen")) {
            process.exit(1);
        }
    }).listen(httpPort, () => {
        if (typeof process.send == "function") {
            // notify PM2 that the service is available.
            process.send("ready");
        } else {
            console.log(green`HTTP Server running at ${chalk.yellow(baseUrl)}.`);
        }
    });
}

if (!isCli) {
    app = new App({
        cookieSecret: <string>config.session.secret,
        domain: hostnames
    });

    switch (httpServer.type) {
        case "http":
            http = new HttpServer(app.listener);
            break;
        case "https":
            http = createServer(httpServer.options, app.listener);
            break;
        case "http2":
            http = require("http2").createSecureServer(httpServer.options, app.listener);
            break;
    }

    if (WS.enabled) {
        if (!WS.port)
            ws = SocketIO(http, WS.options);
        else
            ws = SocketIO(WS.port, WS.options);
    }


    // load worker message handlers
    require("../handlers/worker-shutdown");

    // Load user-defined bootstrap procedures.
    let workerBootstrap = APP_PATH + "/bootstrap/worker.js";
    fs.existsSync(workerBootstrap) && require(workerBootstrap);

    // If auto-start enabled, start the server immediately.
    if (config.server.autoStart) {
        startServer();
    }

    if (isDevMode && config.hotReloading) {
        for (let dirname of config.controllers) {
            dirname = path.resolve(APP_PATH, dirname);
            fs.exists(dirname, exists => {
                if (exists) new DevHotReloader(dirname);
            });
        }
    }
}