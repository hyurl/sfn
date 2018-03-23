import * as util from "util";
import { EventEmitter } from "events";
import Cache  = require("sfn-cache");
import Logger = require("sfn-logger");
import Mail = require("sfn-mail");
import { DB } from "modelar";
import HideProtectedProperties = require("hide-protected-properties");
import { config } from "../../init";
import { LocaleMap } from "./LocaleMap";
import { realCache, realDB } from "./symbols";

export type LogOptions = {
    ttl?: number;
    /** The size of output buffer. */
    size?: number;
    /** The file for storing output logs. */
    filename?: string;
    /** The size of the log file. */
    fileSize?: number;
    /** 
     * If set, when the file size is up limit, instead of compressing it, send
     * it to the mail box.
     */
    mail?: Mail | object;
    /** The action will be set by the framework automatically. */
    action?: string;
};

export const LogOptions: LogOptions = {
    ttl: 1000,
    size: 0,
    filename: process.cwd() + "/logs/sfn.log",
    fileSize: 1024 * 1024 * 2,
    mail: null,
    action: "default"
}

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
    logConfig: LogOptions = Object.assign(LogOptions, {
        action: this.constructor.name
    });

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
        let filename = this.logConfig.filename;
        if (!Service.Loggers[filename]) {
            Service.Loggers[filename] = new Logger(this.logConfig);
        }
        Service.Loggers[filename].action = this.logConfig.action;
        return Service.Loggers[filename];
    }

    /** Get/Set a cache instance. */
    get cache(): Cache {
        if (!this[realCache]) {
            this[realCache] = new Cache(config.redis);
        }
        return this[realCache];
    }

    set cache(v: Cache) {
        this[realCache] = v;
    }

    /** Get/Set a DB instance. */
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