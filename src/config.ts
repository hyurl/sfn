import * as Session from "express-session";
import * as sessionFileStore from "session-file-store";
import { ServerResponse } from "http";
import { Stats } from "fs";
import serveStatic = require("serve-static");
import * as Mail from "sfn-mail";
import { DBConfig } from "modelar";
import { ClientOpts } from "redis";
import { ServerOptions } from "socket.io";
import * as https from "https";
import * as http2 from "http2";
import { SRC_PATH, ROOT_PATH } from "./init";

/**
 * @see https://www.npmjs.com/package/serve-static
 */
interface StaticOptions extends serveStatic.ServeStaticOptions {
    setHeaders?: (res: ServerResponse, path: string, stat: Stats) => void;
};

export interface SFNConfig {
    env?: "dev" | "development" | "pro" | "production";
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
    /**
     * The directories that serve static resources.
     * @see https://www.npmjs.com/package/serve-static
     */
    statics?: string[] | { [path: string]: StaticOptions };
    /** The directories that contain controllers. */
    controllers?: string[];
    /**
     * Hot-reloading only supports controllers, it will watch file changes in 
     * the directories set in `controllers`, and it is conflict with the option 
     * `watches`, if enabled, the later one will stop working.
     * 
     * When any controller file has been modified, rather than reload the whole 
     * server, the system will try to reload the route in memory instead. Make 
     * sure in your own scripts, **DON'T**, in any where, import any controllers
     * yourself, otherwise the hot-reloading may not work as expected.
     */
    hotReloading?: boolean;
    server: {
        /** Host name(s), used for calculating the subdomain. */
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
const env = process.env;

/**
 * The configuration of the program.
 * Some of these settings are for their dependencies, you may check out all 
 * supported options on their official websites.
 */
export const config: SFNConfig = {
    env: <SFNConfig["env"]>env.NODE_ENV || "dev",
    lang: env.LANG || "en-US",
    enableDocRoute: false,
    awaitGenerator: false,
    statics: [SRC_PATH + "/assets"],
    controllers: env.CONTROLLERS ? env.CONTROLLERS.split(/,\s*/) : ["controllers"],
    hotReloading: false,
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
        },
        error: {
            show: true,
            log: true,
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
    },
    redis: {
        host: env.REDIS_HOST || "",
        port: parseInt(env.REDIS_PORT) || undefined
    }
};