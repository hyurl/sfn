import * as Session from "express-session";
import * as FileStore from "session-file-store";
import { ServerResponse } from "http";
import { Stats } from "fs";
import serveStatic = require("serve-static");

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
        },
        /** Configurations of HTTPS server. */
        https?: {
            enabled: boolean;
            port?: number;
            /** If `true`, always redirect HTTP to HTTPS. */
            forceRedirect?: boolean;
            /**
             * @see https://nodejs.org/dist/latest-v8.x/docs/api/https.html#https_https_createserver_options_requestlistener
             */
            credentials?: {
                key?: string;
                cert?: string;
                pfx?: string;
                passphrase?: string;
            }
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
            options?: {
                [option: string]: any;
                pingTimeout?: number,
                pingInterval?: number,
            };
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
    database?: {
        [option: string]: any;
        type?: string;
        host?: string;
        port?: number;
        database: string;
        user?: string;
        password?: string;
    };
    /**
     * Configurations for Express-Session.
     * @see https://www.npmjs.com/package/express-session
     */
    session?: {
        [option: string]: any;
        secret: string,
        name?: string,
        resave?: boolean,
        saveUninitialized?: boolean,
        secure?: boolean,
        unset?: string,
        store?: any;
    };
    /**
     * Configurations for sfn-mail.
     * @see https://github.com/Hyurl/sfn-mail
     */
    mail?: {
        [option: string]: any;
        pool?: boolean;
        host: string;
        port?: number;
        secure?: boolean;
        from: string;
        subject?: string;
        auth: {
            username: string;
            password: string;
        }
    };
    /**
     * Configurations for Redis.
     * @see https://www.npmjs.com/package/redis
     */
    redis?: {
        [option: string]: any;
        host: string,
        port?: number,
    };
}

var Store = <any>FileStore(Session);

// Some of these settings are for their dependencies, you may check out all 
// supported options on their official websites.
export const SFNConfig: SFNConfig = {
    env: process.env.NODE_ENV || "dev",
    workers: ["A"],
    bluebird: false,
    lang: "en-US",
    enableDocRoute: false,
    awaitGenerator: false,
    // staticPath: process.cwd() + "/src/assets",
    statics: [process.cwd() + "/src/assets"],
    server: {
        hostname: "localhost",
        timeout: 120000, // 2 min.
        autoStart: false,
        http: {
            enabled: true,
            port: 80
        },
        https: {
            enabled: false,
            port: 443,
            forceRedirect: true,
            credentials: null
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
        secure: true,
        unset: "destroy",
        store: new Store()
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