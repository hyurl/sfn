import * as util from "util";
import { EventEmitter } from "events";
import HideProtectedProperties = require("hide-protected-properties");
import get = require('lodash/get');
import { Locale } from './interfaces';

export interface ResultMessage {
    success: boolean;
    code: number;
    data?: any;
    error?: string;
}

export interface Service {
    /** If defined, this method will be called to initiate the service. */
    init?(): void | Promise<void>;
    /**
     * If defined, this method will be called when the service is about to be
     * destroyed.
     */
    destroy?(): void | Promise<void>;
}

/**
 * The `Service` class provides some useful functions like `i18n`, `logger`, 
 * `cache` that you can use to do real jobs, and since it is inherited from 
 * EventEmitter, you can bind customized events if needed.
 */
@HideProtectedProperties
export class Service extends EventEmitter {
    /** The language of the current service. */
    lang: string = app.config.lang;

    /**
     * Gets a locale text according to i18n. 
     * 
     * If is a HTTP request, check `req.query.lang` or `req.cookies.lang`, if 
     * is socket message, check `socket.cookies.lang`, if any appears, then 
     * always use the setting language, otherwise, check header 
     * `Accept-Language` instead. Language files are stored in `src/locales/`.
     * 
     * @param text The original text, accept format with %s, %i, etc.
     * @param replacements Values that replaces %s, %i, etc. in the `text`.
     */
    i18n(text: string, ...replacements: string[]): string {
        let mod = get(app.locales, this.lang);
        let defMod = get(app.locales, app.config.lang);
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

    /** Returns a result indicates the operation is succeeded. */
    success(data: any, code: number = 200): ResultMessage {
        return {
            success: true,
            code,
            data,
        };
    }

    /** Returns a result indicates the operation is failed. */
    error(msg: string | Error, code: number = 500): ResultMessage {
        msg = msg instanceof Error ? msg.message : msg;
        return {
            success: false,
            code,
            error: msg
        };
    }
}