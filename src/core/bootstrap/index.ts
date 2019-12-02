import { Server as HttpServer } from "http";
import { Server as HttpsServer, createServer } from "https";
import { Http2SecureServer } from "http2";
import { pathExists } from 'fs-extra';
import { App } from "webium";
import * as SocketIO from "socket.io";
import { SSE } from "sfn-sse";
import { APP_PATH } from "../../init";
import {
    moduleExists,
    createImport,
    importDirectory,
} from "../tools/internal/module";
import { serveTip, inspectAs, baseUrl, define } from "../tools/internal";
import { red } from "../tools/internal/color";
import { serve as serveRepl } from "../tools/internal/repl";
import "./load-message";
import "./life-cycle";
import "./load-rpc";

// Load internal services
import "./load-schedule";

// Initiate hot-reload
import "./hot-reload";

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
        const sse: { [id: string]: SSE };

        /**
         * Starts the web server (both `http` and `ws`) or an RPC server if
         * `id` is provided.
         */
        function serve(id?: string): Promise<void>;
    }
}

/** (Web server only) The basic HTTP router created by **webium** framework. */
export var router: App = null;
/** (Web server only) The HTTP server. */
export var http: HttpServer | HttpsServer | Http2SecureServer = null;
/** (Web server only) The WebSocket server created by **SocketIO** framework. */
export var ws: SocketIO.Server = null;

const tryImport = createImport(require);
let sseContainer = null;

define(app, "router", () => router);
define(app, "http", () => http);
define(app, "ws", () => ws);
define(app, "sse", () => sseContainer);

app.serve = async function serve(id?: string) {
    if (id && !id.startsWith("web-server")) {
        return app.rpc.serve(id);
    }

    let { type, port, timeout, options } = app.config.server.http;
    let WS = app.config.server.websocket;

    global.app.isWebServer = true;
    sseContainer = {};
    router = new App({
        cookieSecret: <string>app.config.session.secret,
        domain: app.config.server.hostname
    });

    switch (type) {
        case "http":
            http = new HttpServer(router.listener);
            break;
        case "https":
            http = createServer(options, router.listener);
            break;
        case "http2":
            http = require("http2").createSecureServer(options, router.listener);
            break;
    }

    if (WS.enabled) {
        if (!WS.port)
            ws = SocketIO(http, WS.options);
        else
            ws = SocketIO(WS.port, WS.options);

        ws = inspectAs(ws, "[Sealed Object]");
    }

    // load HTTP middleware
    await import("../handlers/https-redirector");
    await import("../handlers/http-init");
    await import("../handlers/http-static");
    await import("../handlers/http-body");
    await import("../handlers/http-session");

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
        http["setTimeout"](timeout);
    }

    return new Promise((resolve, reject) => {
        http.on("error", (err: Error) => {
            console.error(red`${err.toString()}`);

            if (err.message.includes("listen")) {
                process.exit(1);
            } else {
                reject(err);
            }
        }).listen(port, async () => {
            try {
                // load controllers
                if (await pathExists(app.controllers.path)) {
                    await importDirectory(app.controllers.path);
                }

                // set the server ID
                if (process.env.NODE_APP_INSTANCE) {
                    app.id = "web-server-" + process.env.NODE_APP_INSTANCE;
                } else {
                    app.id = "web-server";
                }

                // invoke all start-up hooks.
                await app.hooks.lifeCycle.startup.invoke();

                console.log(serveTip("Web", app.id, baseUrl()));

                // try to connect all RPC services.
                await app.rpc.connectAll(true);

                // try to serve the REPL server.
                await serveRepl(app.id);

                if (!app.isDevMode) {
                    // notify PM2 that the service is available.
                    process.send("ready");
                }

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    });
}