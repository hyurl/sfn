import * as util from "util";
import { EventEmitter } from "events";
import Cache  = require("sfn-cache");
import * as Logger from "sfn-logger";
import { DB } from "modelar";
import HideProtectedProperties = require("hide-protected-properties");
import { ROOT_PATH } from "../../init";
import { config } from "../bootstrap/ConfigLoader";
import { LocaleMap } from "./LocaleMap";
import { realCache, realDB } from "./symbols";

export interface LogOptions extends Logger.Options {
    /** The action will be set by the framework automatically. */
    action?: string;
};

export const LogOptions: LogOptions = Object.assign({}, Logger.Options, {
    ttl: 1000,
    filename: ROOT_PATH + "/logs/sfn.log",
    fileSize: 1024 * 1024 * 2,
    action: "default"
});

/**
 * The `Service` class provides some useful functions like `i18n`, `logger`, 
 * `cache` that you can use to do real jobs, and since it is inherited from 
 * EventEmitter, you can bind customized events if needed.
 */
@HideProtectedProperties
export class Service extends EventEmitter {
    /** The language of the current service. */
    lang: string = config.lang;
    /** Configurations for the logger in this instance. */
    logOptions: LogOptions = Object.assign({}, LogOptions, {
        action: this.constructor.name
    });
    /** `deprecated`, use `logOptions` instead. */
    logConfig = this.logOptions;

    static readonly Loggers: { [filename: string]: Logger } = {};

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
        var locale = LocaleMap,
            lang = this.lang.toLowerCase(),
            _lang = config.lang.toLowerCase();

        if (locale[lang] && locale[lang][text]) {
            text = locale[lang][text];
        } else if (locale[_lang] && locale[_lang][text]) {
            text = locale[_lang][text];
        }

        return util.format(text, ...replacements);
    }

    /** Gets a logger instance. */
    get logger(): Logger {
        let filename = this.logOptions.filename;
        if (!Service.Loggers[filename]) {
            Service.Loggers[filename] = new Logger(this.logOptions);
        }
        Service.Loggers[filename].action = this.logOptions.action;
        return Service.Loggers[filename];
    }

    /** Gets/Sets a cache instance. */
    get cache(): Cache {
        if (!this[realCache]) {
            this[realCache] = new Cache(config.redis);
        }
        return this[realCache];
    }

    set cache(v: Cache) {
        this[realCache] = v;
    }

    /** Gets/Sets a DB instance. */
    get db(): DB {
        if (!this[realDB]) {
            this[realDB] = new DB(config.database);
        }
        return this[realDB];
    }

    set db(v: DB) {
        this[realDB] = v;
    }
}