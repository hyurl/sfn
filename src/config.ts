import * as Session from "express-session";
import { ServerResponse } from "http";
import { Stats } from "fs";
import serveStatic = require("serve-static");
import { ServerOptions } from "socket.io";
import * as https from "https";
import * as http2 from "http2";
import { RpcOptions, ClientOptions } from 'alar';
import { FSWatcher } from "chokidar";

declare global {
    namespace app {
        const config: Config;
        interface Config {
            /** Default language of the application. */
            lang?: string;
            /**
             * Save schedules when the system shuts down and rebuild after
             * reboot.
             */
            saveSchedules?: boolean;
            /**
             * The directories that serve static resources.
             * @see https://www.npmjs.com/package/serve-static
             */
            statics?: string[] | { [path: string]: StaticOptions };
            /**
             * Watch modules and when files changed, refresh the memory cache
             * and hot-reload the module.
             * 
             * NOTE: **DO NOT** import the module statically in anywhere,
             * otherwise it may not be reloaded as expected.
             * 
             * @see https://github.com/hyurl/alar
             */
            watch?: { watch: (...args: any[]) => FSWatcher }[];
            server: {
                /** Host name(s), used for calculating the sub-domain. */
                hostname?: string | string[];
                /**
                 * Since SFN 0.2.0, when HTTPS or HTTP2 is enabled, will always 
                 * force HTTP request to redirect to the new protocol, and 
                 * setting port for HTTP server is no longer allowed, the 
                 * framework will automatically start a server that listens port
                 * `80` to accept HTTP request and redirect them to HTTPS.
                 */
                http?: {
                    /** Server type, AKA protocol type, default value: `http`. */
                    type?: "http" | "https" | "http2";
                    /** Default value is `80`. */
                    port?: number;
                    /** HTTP request timeout, default value is `120000`. */
                    timeout?: number;
                    /**
                     * These options are mainly for type `http` and type `http2`.
                     * @see https://nodejs.org/dist/latest-v10.x/docs/api/https.html#https_https_createserver_options_requestlistener
                     * @see https://nodejs.org/dist/latest-v10.x/docs/api/http2.html#http2_http2_createserver_options_onrequesthandler
                     * @see https://nodejs.org/dist/latest-v10.x/docs/api/tls.html#tls_tls_createsecurecontext_options
                     */
                    options?: https.ServerOptions & http2.ServerOptions;
                };
                /** Configurations of WebSocket server. */
                websocket?: {
                    enabled?: boolean;
                    /**
                     * By default, this `port` is `0` or `undefined`, that means
                     * it will attach to the HTTP server instead. If you change
                     * it, it will listen to that port instead.
                     */
                    port?: number;
                    /**
                     * Options for SocketIO.
                     * @see https://socket.io
                     */
                    options?: ServerOptions;
                };
                /**
                 * Configurations for RPC services.
                 * @see https://github.com/hyurl/alar
                 */
                rpc?: {
                    [id: string]: RpcOptions & ClientOptions & {
                        [x: string]: any;
                        /** The services that should be hosted by this server. */
                        services: ModuleProxy<any>[];
                        /**
                         * The services that this server depended on. (hosted 
                         * ones excluded.)
                         */
                        dependencies?: "all" | ModuleProxy<any>[];
                        /**
                         * Whether to allow services fallback to their local
                         * instances when the remote instance is not available.
                         * @default true
                         */
                        fallbackToLocal?: boolean;
                    }
                };
            };
            /**
             * Configurations for Express-Session.
             * @see https://www.npmjs.com/package/express-session
             */
            session?: Session.SessionOptions;
        }
    }
}

/**
 * @see https://www.npmjs.com/package/serve-static
 */
export interface StaticOptions extends serveStatic.ServeStaticOptions {
    /** 
     * If `true`, the URL must contain the folder name (relative to `SRC_PATH`) 
     * as prefix to reach the static resource. Also you can set a specified 
     * prefix other than the folder name.
     */
    prefix?: boolean | string;
    setHeaders?: (res: ServerResponse, path: string, stat: Stats) => void;
};

/**
 * The configuration of the program.
 * Some of these settings are for their dependencies, you may check out all 
 * supported options on their official websites.
 */
export default <app.Config>{
    lang: "en-US",
    saveSchedules: false,
    statics: ["assets"],
    watch: [],
    server: {
        hostname: "localhost",
        http: {
            type: "http",
            port: 4000,
            timeout: 120000, // 2 min.
            options: null
        },
        websocket: {
            enabled: true,
            port: undefined,
            options: {
                pingTimeout: 5000,
                pingInterval: 5000
            },
        },
        rpc: {}
    },
    session: {
        secret: "sfn",
        name: "sid",
        resave: true,
        saveUninitialized: true,
        unset: "destroy",
        cookie: {
            maxAge: 3600 * 24 * 1000 // 24 hours (in milliseconds)
        }
    }
};