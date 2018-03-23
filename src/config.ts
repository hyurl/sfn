import * as Session from "express-session";
import * as FileStore from "session-file-store";

let Store = <any>FileStore(Session);

export interface SFNConfig {
    /** `dev`: development, `pro`: production. */
    env: "dev" | "pro";
    /** Use bluebird to replace native Promise. */
    bluebird: boolean;
    /** Default language of the application. */
    lang: string;
	/**
	 * If `true`, when a method's jsdoc contains tag `@route` (for 
	 * `HttpController`s) or `@event` (for `SocektController`s), the value 
	 * after them will be used as a HTTP route or socket event.
	 * @example
	 * @route GET /user/:id
	 * @event show-user-info
	 */
    enableDocRoute: boolean;
    /** Worker names, must not more than CPU numbers. */
    workers: string[];
    /** The directory that serves static resources. */
    staticPath: string;
    server: {
        /** host name(s), used for calculating subdomains. */
        host: string | string[];
        port: number;
        /** HTTP request timeout. */
        timeout: number;
        /**
         * Auto-start server when worker is online, if `false`, you must call 
         * `startServer()` manually.
         */
        autoStart: boolean;
        /** Configurations of HTTPS server. */
        https: {
            enabled: boolean;
            port: number;
            /** If `true`, always redirect HTTP to HTTPS. */
            forceRedirect: boolean;
            credentials: { // You could use {pfx, passphrase} as well.
                key?: string;
                cert?: string;
                pfx?: string;
                passphrase?: string;
            }
        };
        /** Configurations of socket server. */
        socket: {
            enabled: boolean;
            /** Options for SocketIO. */
            options: {
                [option: string]: any;
                pingTimeout: number,
                pingInterval: number,
            };
        };
        /** Configurations when HTTP requests or socket events throw errors. */
        error: {
            /** If `true`, display full error information to the client. */
            show: boolean;
            /** If `true` errors will be logged to disk files. */
            log: boolean;
        };
    };
    /** Configurations for Modelar ORM. */
    database: {
        [option: string]: any;
        type: string;
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
    };
    /** Configurations for Express-Session. */
    session: {
        [option: string]: any;
        secret: string,
        name: string,
        resave: boolean,
        saveUninitialized: boolean,
        secure: boolean,
        unset: string,
        store: any;
    };
    /**
     * Configurations for sfn-mail.
     * @see https://github.com/Hyurl/sfn-mail
     */
    mail: {
        [option: string]: any;
        pool: boolean;
        host: string;
        port: number;
        secure: boolean;
        from: string;
        subject?: string;
        auth: {
            username: string;
            password: string;
        }
    };
    /** Configurations for Redis. */
    redis: {
        [option: string]: any;
        host: string,
        port: number,
    };
}

// Some of these settings are for their dependencies, you may check out all 
// supported options on their official websites.
export const SFNConfig: SFNConfig = {
    env: "dev",
    bluebird: false,
    lang: "en-US",
    enableDocRoute: false,
    workers: ["A"],
    staticPath: process.cwd() + "/src/assets",
    server: {
        host: "localhost",
        port: 80,
        timeout: 120000, // 2 min.
        autoStart: false,
        https: {
            enabled: false,
            port: 443,
            forceRedirect: true,
            credentials: null
        },
        socket: {
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