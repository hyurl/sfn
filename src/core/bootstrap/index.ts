import * as fs from "fs";
import * as path from "path";
import { Server as HttpServer } from "http";
import { Server as HttpsServer, createServer } from "https";
import { Http2SecureServer } from "http2";
import chalk from "chalk";
import { App } from "webium";
import * as SocketIO from "socket.io";
import * as Worker from "sfn-worker";
import without = require("lodash/without");
import { Socket as DgramServer } from "dgramx";
import { APP_PATH, isCli } from "../../init";
import { config, isDevMode } from "./ConfigLoader";
import { DevWatcher } from "../tools/DevWatcher";
import { DevHotReloader } from "../tools/DevHotReloader";
import { red, green } from "../tools/functions-inner";

/** Whether the current process is the master process. */
export const isMaster: boolean = Worker.isMaster;
/** Whether the current process is a worker process. */
export const isWorker: boolean = Worker.isWorker;

/** (worker only) The Worker instance created by **sfn-worker**. */
export var worker: Worker = null;
/** (worker only) The App instance created by **webium** framework. */
export var app: App = null;
/** (worker only) The HTTP server. */
export var http: HttpServer | HttpsServer | Http2SecureServer = null;
/** (worker only) The WebSocket server created by **SocketIO**. */
export var ws: SocketIO.Server = null;
/** (master only) The Datagram server created by **dgramx**. */
export var dgram: DgramServer = null;

let hostnames = config.server.hostname,
    hostname = Array.isArray(hostnames) ? hostnames[0] : hostnames,
    httpServer = config.server.http,
    httpPort = httpServer.port,
    WS = config.server.websocket,
    workers = config.workers,
    serverStarted = false;

/**
 * (worker only) Starts HTTP server and socket server (if enabled).
 */
export function startServer() {
    if (Worker.isMaster) {
        throw new Error("The server can only be run in a worker process.");
    } else if (serverStarted) {
        throw new Error("Server already started.");
    }

    serverStarted = true;

    // load HTTP middleware
    require("../handlers/worker/https-redirector");
    require("../handlers/worker/http-init");
    require("../handlers/worker/http-static");
    require("../handlers/worker/http-xml");
    require("../handlers/worker/http-session");
    require("../handlers/worker/http-db");
    require("../handlers/worker/http-auth");

    // Load user-defined bootstrap procedures.
    let httpBootstrap = APP_PATH + "/bootstrap/http.js";
    fs.existsSync(httpBootstrap) ? require(httpBootstrap) : null;

    // load controllers
    require("../bootstrap/ControllerLoader");

    // load HTTP route handler
    // require("../handlers/worker/http-route");

    if (WS.enabled) {
        // load WebSocket event handler
        require("../handlers/worker/websocket-event");

        // Load user-defined bootstrap procedures.
        let wsBootstrap = APP_PATH + "/bootstrap/websocket.js";
        fs.existsSync(wsBootstrap) ? require(wsBootstrap) : null;
    }

    // Start HTTP server.
    if (typeof http["setTimeout"] == "function") {
        http["setTimeout"](config.server.timeout);
    }

    http.on("error", (err: Error) => {
        console.log(red`${err.toString()}`);
    }).listen(httpPort, (err: Error) => {
        if (!worker.rebootTimes) {
            let port = http.address()["port"] || httpPort,
                host = hostname + (port == 80 || port == 443 ? "" : ":" + port);

            // notify the master that server has been started.
            worker.emit("server-started", host);
        } else {
            // notify the master that server has been restarted.
            worker.emit("server-restarted");
        }
    });
}

if (Worker.isMaster && !isCli) {
    // Master process, folk workers.
    if (workers.length === 0) {
        throw new Error("No worker was configured.");
    }

    if (config.server.dgram.enabled) {
        // Start UDP Server for receiving commands from outside the program.
        dgram = new DgramServer("udp4");
        dgram.bind(config.server.dgram.port);
    }

    // load Datagram CLI handlers
    require("../handlers/master/worker-list");
    require("../handlers/master/worker-reload");
    require("../handlers/master/service-stop");

    // Load user-defined bootstrap procedures.
    let masterBootstrap = APP_PATH + "/bootstrap/master.js";
    fs.existsSync(masterBootstrap) ? require(masterBootstrap) : null;

    let httpCount = 0;

    // Listen worker processes, when their servers is started, notify the
    // master and print a message.
    Worker.on("online", worker => {
        console.log(green`Worker <` + chalk.yellow(worker.id) + "> online!");

        worker.on("error", (err: Error) => {
            console.error(red`${err.toString()}`);
        }).on("server-started", (host: string) => {
            httpCount++;
            !workers.includes(worker.id) ? workers.push(worker.id) : null;

            if (httpCount === workers.length) {
                httpCount = 0;

                let type = config.server.http.type,
                    link = (type == "http2" ? "https" : type) + "://" + host,
                    msg = green`HTTP Server running at ${chalk.yellow(link)}.`,
                    argv = process.argv[2] || "",
                    matches = argv.match(/--udp-client=(.+):(.+)/);

                if (dgram && matches) {
                    // send feedback to the CLI.
                    let addr = matches[1],
                        port = parseInt(matches[2]);

                    dgram.to(addr, port).emit("service-started", msg);
                } else if (!matches) {
                    console.log(msg);
                }
            }
        });
    }).on("exit", (worker) => {
        workers = without(workers, worker.id);
    });

    // folk workers.
    for (let name of workers) {
        new Worker(name, !isDevMode);
    }

    // Watch for file changes, when a file is modified, reboot the workers.
    if (isDevMode && !config.hotReloading) {
        for (let filename of config.watches) {
            if (path.extname(filename) == ".ts")
                filename = filename.slice(0, -3) + ".js";

            filename = path.resolve(APP_PATH, filename);

            fs.exists(filename, exists => {
                if (exists) new DevWatcher(filename);
            });
        }
    }
} else if (isWorker) {
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

    Worker.on("online", _worker => {
        worker = _worker;

        // load worker message handlers
        require("../handlers/worker/worker-reload");
        require("../handlers/worker/worker-stop");

        // Load user-defined bootstrap procedures.
        let workerBootstrap = APP_PATH + "/bootstrap/worker.js";
        fs.existsSync(workerBootstrap) ? require(workerBootstrap) : null;

        // If auto-start enabled, start the server immediately.
        if (config.server.autoStart) {
            startServer();
        }
    });

    if (isDevMode && config.hotReloading) {
        for (let dirname of config.controllers) {
            dirname = path.resolve(APP_PATH, dirname);
            fs.exists(dirname, exists => {
                if (exists) new DevHotReloader(dirname);
            });
        }
    }
}