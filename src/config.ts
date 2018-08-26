import * as Session from "express-session";
import * as sessionFileStore from "session-file-store";
import { ServerResponse } from "http";
import { Stats } from "fs";
import serveStatic = require("serve-static");
import * as Mail from "sfn-mail";
import { DBConfig } from "modelar";
import { ClientOpts } from "redis";
import { ServerOptions } from "socket.io";
import * as tls from "tls";
import { SRC_PATH, ROOT_PATH } from "./init";

/**
 * @see https://www.npmjs.com/package/serve-static
 */
export interface StaticOptions extends serveStatic.ServeStaticOptions {
    setHeaders?: (res: ServerResponse, path: string, stat: Stats) => void;
};

export interface SFNConfig {
    /** `dev` | `development`, `pro` | `production`. */
    env?: string;
    /** Worker names, must not more than CPU numbers. */
    workers?: string[];
    /** Use bluebird to replace native Promise. */
    bluebird?: boolean;
    /** Default language of the application. */
    lang?: string;
	/**
	 * If `true`, when a method's jsdoc contains tag `@route` (for 
	 * `HttpController`s) or `@event` (for `SocektController`s), the value 
	 * after them will be used as a HTTP route or socket event.
	 * @example
	 * @route GET /user/:id
	 * @event show-user-info
	 */
    enableDocRoute?: boolean;
    /**
     * If `true`, when a method is a generator function, it will be treated as
     * a coroutine function and await its result.
     */
    awaitGenerator?: boolean;
    /** **deprecated**, use `statics` instead. */
    staticPath?: string;
    /**
     * The directories that serve static resources.
     * @see https://www.npmjs.com/package/serve-static
     */
    statics?: string[] | { [path: string]: StaticOptions },
    /** 
     * Watch file changes of the given file/folder names in `APP_PATH`, when 
     * watching a folder, watching `.js/.ts` and `.json` files in it.
     */
    watches?: string[],
    server: {
        /** **deprecated**, use `hostname` instead. */
        host?: string | string[];
        /** **deprecated**, use `http.port` instead. */
        port?: number;
        /** Host name(s), used for calculating the subdomain. */
        hostname?: string | string[];
        /** HTTP request timeout. */
        timeout?: number;
        /**
         * Auto-start server when worker is online, if `false`, you must call 
         * `startServer()` manually.
         */
        autoStart?: boolean;
        http?: {
            enabled: boolean;
            port?: number;
        };
        /** Configurations of HTTPS server. */
        https?: {
            enabled: boolean;
            port?: number;
            /** If `true`, always redirect HTTP to HTTPS. */
            forceRedirect?: boolean;
            /**
             * @see https://nodejs.org/dist/latest-v8.x/docs/api/https.html#https_https_createserver_options_requestlistener
             * @see https://nodejs.org/dist/latest-v8.x/docs/api/tls.html#tls_tls_createsecurecontext_options
             */
            options?: tls.TlsOptions;
            /** **deprecated** use `options` instead. */
            credentials?: SFNConfig["server"]["https"]["options"],
            /** Upgrade to HTTP/2. */
            http2: boolean;
        };
        /** **deprecated**, use `websocket` instead. */
        socket?: SFNConfig["server"]["websocket"];
        /** Configurations of WebSocket server. */
        websocket?: {
            enabled: boolean;
            /**
             * Options for SocketIO.
             * @see https://socket.io
             */
            options?: ServerOptions;
        },
        /** Configurations when HTTP requests or socket events throw errors. */
        error?: {
            /** If `true`, display full error information to the client. */
            show?: boolean;
            /** If `true` errors will be logged to disk files. */
            log?: boolean;
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
    /**
     * Configurations for Redis.
     * @see https://www.npmjs.com/package/redis
     */
    redis?: ClientOpts;
}

const FileStore = sessionFileStore(Session);

// Some of these settings are for their dependencies, you may check out all 
// supported options on their official websites.
export const SFNConfig: SFNConfig = {
    env: process.env.NODE_ENV || "pro",
    workers: ["A"],
    bluebird: false,
    lang: "en-US",
    enableDocRoute: false,
    awaitGenerator: false,
    statics: [SRC_PATH + "/assets"],
    watches: ["index.ts", "config.ts", "bootstrap", "controllers", "locales", "models"],
    server: {
        hostname: "localhost",
        timeout: 120000, // 2 min.
        autoStart: true,
        http: {
            enabled: true,
            port: 80
        },
        https: {
            enabled: false,
            port: 443,
            forceRedirect: true,
            options: null,
            http2: false
        },
        websocket: {
            enabled: true,
            options: {
                pingTimeout: 5000,
                pingInterval: 5000
            },
        },
        error: {
            show: true,
            log: true,
        }
    },
    database: {
        type: "mysql",
        host: "localhost",
        port: 3306,
        database: "modelar",
        user: "root",
        password: "161301"
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
        host: "",
        port: 25,
        secure: false,
        from: "",
        auth: {
            username: "",
            password: ""
        }
    },
    redis: {
        host: null,
        port: null
    }
};