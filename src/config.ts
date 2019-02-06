import * as Session from "express-session";
import * as sessionFileStore from "session-file-store";
import { ServerResponse } from "http";
import { Stats } from "fs";
import serveStatic = require("serve-static");
import * as Mail from "sfn-mail";
import { DBConfig } from "modelar";
import { ServerOptions } from "socket.io";
import * as https from "https";
import * as http2 from "http2";
import { ROOT_PATH } from "./init";

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

export interface SFNConfig {
    [x: string]: any;
    /** Default language of the application. */
    lang?: string;
    /**
     * The directories that serve static resources.
     * @see https://www.npmjs.com/package/serve-static
     */
    statics?: string[] | { [path: string]: StaticOptions };
    /**
     * When any module file has been modified, rather than restart the whole 
     * server, the program will try to refresh the memory cache instead.
     * The hot-reloading feature if powered by **Alar** framework, and make sure
     * you **DON'T** import the module statically in anywhere, otherwise it may 
     * not be reload as expected.
     * 
     * Currently, only `controllers`, `models` and `services` can be 
     * hot-reloaded.
     * @see https://github.com/hyurl/alar
     */
    hotReloading?: boolean;
    server: {
        /** Host name(s), used for calculating the sub-domain. */
        hostname?: string | string[];
        /** HTTP request timeout, default value is `120000`. */
        timeout?: number;
        /**
         * Auto-start server when worker is online, if `false`, you must call 
         * `startServer()` manually.
         */
        autoStart?: boolean;
        /**
         * Since SFN 0.2.0, when HTTPS or HTTP2 is enabled, will always force 
         * HTTP request to redirect to the new protocol, and setting port for 
         * HTTP server is no longer allowed, the framework will automatically 
         * start a server that listens port `80` to accept HTTP request and 
         * redirect them to HTTPS.
         */
        http?: {
            /** Server type, AKA protocol type, default value is `http`. */
            type?: "http" | "https" | "http2";
            /** Default value is `80`. */
            port?: number;
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
             * By default, this `port` is `0` or `undefined`, that means it will
             * attach to the HTTP server instead. If you change it, it will 
             * listen to that port instead.
             */
            port?: number;
            /**
             * Options for SocketIO.
             * @see https://socket.io
             */
            options?: ServerOptions;
        };
    };
    /**
     * Configurations for Modelar ORM.
     * @see https://github.com/hyurl/modelar
     */
    database?: DBConfig;
    /**
     * Configurations for Express-Session.
     * @see https://www.npmjs.com/package/express-session
     */
    session?: Session.SessionOptions;
    /**
     * Configurations for sfn-mail.
     * @see https://github.com/Hyurl/sfn-mail
     */
    mail?: Mail.Options & Mail.Message;
}

const FileStore = sessionFileStore(Session);
const env = process.env;

/**
 * The configuration of the program.
 * Some of these settings are for their dependencies, you may check out all 
 * supported options on their official websites.
 */
export const config: SFNConfig = {
    lang: env.LANG || "en-US",
    statics: ["assets"],
    hotReloading: true,
    server: {
        hostname: "localhost",
        timeout: 120000, // 2 min.
        autoStart: true,
        http: {
            type: <SFNConfig["server"]["http"]["type"]>env.HTTP_TYPE || "http",
            port: parseInt(env.HTTP_PORT) || 80,
            options: null
        },
        websocket: {
            enabled: true,
            port: undefined,
            options: {
                pingTimeout: 5000,
                pingInterval: 5000
            },
        }
    },
    database: {
        type: env.DB_TYPE || "mysql",
        host: env.DB_HOST || "localhost",
        port: parseInt(env.DB_PORT) || 3306,
        database: env.DB_NAME || "sfn",
        user: env.DB_USER || "root",
        password: env.DB_PASS || "123456"
    },
    session: {
        secret: "sfn",
        name: "sfn-sid",
        resave: true,
        saveUninitialized: true,
        unset: "destroy",
        store: new FileStore({
            path: ROOT_PATH + "/sessions",
            ttl: 3600 * 24 // 24 hours (in seconds)
        }),
        cookie: {
            maxAge: 3600 * 24 * 1000 // 24 hours (in milliseconds)
        }
    },
    mail: {
        pool: false,
        host: env.MAIL_HOST || "smtp.gmail.com",
        port: parseInt(env.MAIL_PORT) || 25,
        secure: false,
        from: env.MAIL_FROM || "",
        auth: {
            username: env.MAIL_USER || "",
            password: env.MAIL_PASS || ""
        }
    }
};