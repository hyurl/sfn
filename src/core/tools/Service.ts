import * as util from "util";
import { EventEmitter } from "events";
import HideProtectedProperties = require("hide-protected-properties");
import get = require('lodash/get');
import { Locale } from './interfaces';
import { Queue } from "dynamic-queue";

/**
 * The `Service` class provides some useful functions like `i18n`, `logger`, 
 * `cache` that you can use to do real jobs, and since it is inherited from 
 * EventEmitter, you can bind customized events if needed.
 */
@HideProtectedProperties
export class Service extends EventEmitter implements Service {
    /** The language of the current service. */
    lang: string = app.config.lang;

    private throttles: { [key: string]: number } = {};
    private queues: { [key: string]: Queue } = {};
    private gcTimer: NodeJS.Timer = null;

    protected gc(): void | Promise<void> {
        let now = Date.now();

        for (let key in this.throttles) {
            if (this.throttles[key] < now) {
                delete this.throttles[key];
            }
        }

        for (let key in this.queues) {
            if (this.queues[key].length === 0) {
                this.queues[key].stop();
                delete this.queues[key];
            }
        }
    }

    /** This method will be called to initiate the service. */
    init(): void | Promise<void> {
        this.gcTimer = setInterval(() => this.gc(), 1000 * 30);
    }

    /**
     * This method will be called when the service is about to be destroyed.
     */
    destroy(): void | Promise<void> {
        this.gcTimer && clearInterval(this.gcTimer);
        this.gc();
    }

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
        let mod: ModuleProxy<Locale> = null;
        let defMod = get(app.locales, app.config.lang);
        let locale: Locale = null;
        let stmt: string;

        try { mod = get(app.locales, this.lang) } catch (e) { }

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

    /**
     * Throttles the operation in the body associated to a unique key.
     * @param interval default `0`.
     */
    async throttle<T>(
        key: string,
        body: () => T | Promise<T>,
        interval = 0,
        error: any = new Error("To many operations")
    ) {
        let result = await new Promise<T>((resolve, reject) => {
            let now = Date.now();

            if (this.throttles[key] && this.throttles[key] >= now) {
                return reject(error);
            } else {
                this.throttles[key] = now + interval;
                resolve(body.call(this));
            }
        });

        return result;
    }

    /**
     * Queues the operation in the body associated to a unique key.
     */
    async queue<T>(key: string, body: () => T | Promise<T>) {
        return new Promise<T>((resolve, reject) => {
            if (!this.queues[key]) {
                this.queues[key] = new Queue();
            }

            this.queues[key].push(async () => {
                try {
                    resolve(await body.call(this));
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
}