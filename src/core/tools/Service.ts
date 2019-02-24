import * as util from "util";
import * as path from "path";
import { EventEmitter } from "events";
import { Storage, StoreOptions } from "cluster-storage";
import * as Logger from "sfn-logger";
import { DB } from "modelar";
import { injectable, injected } from "injectable-ts";
import HideProtectedProperties = require("hide-protected-properties");
import { ROOT_PATH } from "../../init";
import { config } from "../bootstrap/load-config";
import get = require('lodash/get');
import { Locale } from './interfaces';

injectable(DB);

export const LogOptions: Logger.Options = Object.assign({}, Logger.Options, {
    ttl: 1000,
    filename: ROOT_PATH + "/logs/sfn.log",
    fileSize: 1024 * 1024 * 2,
    trace: false
});

export interface CacheOptions extends StoreOptions {
    name: string
}

export const CacheOptions: CacheOptions = {
    name: "sfn",
    path: ROOT_PATH + "/cache",
    gcInterval: 120000
};

/**
 * The `Service` class provides some useful functions like `i18n`, `logger`, 
 * `cache` that you can use to do real jobs, and since it is inherited from 
 * EventEmitter, you can bind customized events if needed.
 */
@injectable
@HideProtectedProperties
export class Service extends EventEmitter {
    /** The language of the current service. */
    lang: string = config.lang;
    /** Configurations for the logger in this instance. */
    logOptions: Logger.Options = Object.assign({}, LogOptions);
    /** Configurations for the logger in this instance. */
    cacheOptions: CacheOptions = Object.assign({}, CacheOptions);

    static readonly Loggers: { [filename: string]: Logger } = {};
    static readonly Caches: { [filename: string]: Storage } = {};

    /**
     * Gets a locale text according to i18n. 
     * 
     * If is a HTTP request, check `req.query.lang` or `req.cookies.lang`, if 
     * is socket message, check `socket.cookies.lang`, if any appears, then 
     * always use the setting language, otherwise, check header 
     * `Accept-Language` instead. Language files are stored in `Locales`, 
     * could be json or js, and case insensitive.
     * 
     * @param text The original text, accept format with %s, %i, etc.
     * @param replacements Values that replaces %s, %i, etc. in the `text`.
     */
    i18n(text: string, ...replacements: string[]): string {
        let mod = get(app.locales, this.lang);
        let defMod = get(app.locales, config.lang);
        let locale: Locale = null;
        let stmt: string;

        if (mod && mod.proto) {
            locale = mod.instance();
            locale[text] && (stmt = locale[text]);
        }

        if (stmt === undefined && defMod && defMod.proto) {
            locale = defMod.instance();
            locale[text] && (stmt = locale[text]);
        }

        (stmt === undefined) && (stmt = text);

        return util.format(stmt, ...replacements);
    }

    /** Gets a logger instance. */
    get logger(): Logger {
        let filename = this.logOptions.filename || LogOptions.filename;

        if (!Service.Loggers[filename]) {
            let options = Object.assign({}, LogOptions, this.logOptions);
            Service.Loggers[filename] = new Logger(options);
        }

        return Service.Loggers[filename];
    }

    /** Gets a cache instance. */
    get cache(): Storage {
        let { path: dirname, name } = this.cacheOptions;
        let filename = path.resolve(dirname, name + ".db");

        if (!Service.Caches[filename]) {
            Service.Caches[filename] = new Storage(name, this.cacheOptions);
        }

        return Service.Caches[filename];
    }

    /** Gets/Sets a DB instance. */
    @injected([config.database])
    db: DB;
}

export default new Service();