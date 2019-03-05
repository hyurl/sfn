import { Server as HttpServer } from "http";
import { Server as HttpsServer, createServer } from "https";
import { Http2SecureServer } from "http2";
import { App } from "webium";
import * as SocketIO from "socket.io";
import { SSE } from "sfn-sse";
import channel from "ipchannel";
import { APP_PATH, isCli, isWebServer, isTsNode } from "../../init";
import { config, baseUrl } from "./load-config";
import {
    red,
    moduleExists,
    createImport,
    importDirectory,
    serveTip
} from "../tools/functions-inner";
import "./load-controllers";
import "./load-services";
import "./load-models";
import "./load-utils";
import "./load-views";
import "./load-locales";
import "./load-plugins";
import "./load-rpc";
import "./life-cycle";
import "./load-message";
import "./load-schedule";
import { watchWebModules } from "./hot-reload";
import { pathExists } from 'fs-extra';

declare global {
    namespace app {
        const router: App;
        const http: HttpServer | HttpsServer | Http2SecureServer;
        /**
         * This property is reserved by the framework, use `app.message.ws` 
         * instead.
         * @inner
         */
        const ws: SocketIO.Server;

        /**
         * This property is reserved by the framework, use `app.message.sse`
         * instead.
         * @inner
         */
        const sse: { [id: number]: SSE };

        /** Starts the web server (both `http` and `ws`). */
        function serve(): Promise<void>;
    }
}

/** (Web server only) The basic HTTP router created by **webium** framework. */
export var router: App = null;
/** (Web server only) The HTTP server. */
export var http: HttpServer | HttpsServer | Http2SecureServer = null;
/** (Web server only) The WebSocket server created by **SocketIO** framework. */
export var ws: SocketIO.Server = null;

const tryImport = createImport(require);
let hostnames = config.server.hostname,
    httpServer = config.server.http,
    httpPort = httpServer.port,
    WS = config.server.websocket;

app.serve = function serve() {
    return new Promise((resolve, reject) => {
        if (!isWebServer) {
            let entry = "<APP_PATH>/index" + (isTsNode ? ".ts" : ".js");
            throw new Error(`The web server entry file must be ${entry}`);
        }

        // load HTTP middleware
        require("../handlers/https-redirector");
        require("../handlers/http-init");
        require("../handlers/http-static");
        require("../handlers/http-xml");
        require("../handlers/http-session");
        require("../handlers/http-db");
        require("../handlers/http-auth");

        // Load user-defined bootstrap procedures.
        let httpBootstrap = APP_PATH + "/bootstrap/http";
        moduleExists(httpBootstrap) && tryImport(httpBootstrap);

        if (WS.enabled) {
            // Load user-defined bootstrap procedures.
            let wsBootstrap = APP_PATH + "/bootstrap/websocket";
            moduleExists(wsBootstrap) && tryImport(wsBootstrap);
        }

        // Start HTTP server.
        if (typeof http["setTimeout"] == "function") {
            http["setTimeout"](config.server.http.timeout);
        }

        http.on("error", (err: Error) => {
            console.log(red`${err.toString()}`);

            if (err.message.includes("listen")) {
                process.exit(1);
            } else {
                reject(err);
            }
        }).listen(httpPort, async () => {
            try {
                // load controllers
                if (await pathExists(app.controllers.path)) {
                    await importDirectory(app.controllers.path);
                }

                let finish = () => {
                    // Set the server ID.
                    app.serverId = "web-server-" + channel.pid;

                    watchWebModules();

                    if (typeof process.send == "function") {
                        // notify PM2 that the service is available.
                        process.send("ready");
                    } else {
                        console.log(serveTip("Web", app.serverId, baseUrl));
                    }

                    resolve();
                }

                if (channel.pid) {
                    finish();
                } else {
                    channel.on("connect", finish);
                }
            } catch (err) {
                reject(err);
            }
        });
    });
}

if (!isCli) {
    if (isWebServer) {
        router = new App({
            cookieSecret: <string>config.session.secret,
            domain: hostnames
        });

        switch (httpServer.type) {
            case "http":
                http = new HttpServer(router.listener);
                break;
            case "https":
                http = createServer(httpServer.options, router.listener);
                break;
            case "http2":
                http = require("http2").createSecureServer(
                    httpServer.options,
                    router.listener
                );
                break;
        }

        if (WS.enabled) {
            if (!WS.port)
                ws = SocketIO(http, WS.options);
            else
                ws = SocketIO(WS.port, WS.options);
        }
    }
}

global["app"].router = router;
global["app"].http = http;
global["app"].ws = ws;
global["app"].sse = isWebServer ? {} : null;

if (!isCli) {
    // Load user-defined bootstrap procedures.
    let bootstrap = APP_PATH + "/bootstrap/index";
    moduleExists(bootstrap) && tryImport(bootstrap);

    // load plugins
    pathExists(app.plugins.path).then(async (exists) => {
        exists && (await importDirectory(app.plugins.path));
        await app.plugins.lifeCycle.startup.invoke();
    });
}