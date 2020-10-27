import * as util from "util";
import { EventEmitter } from "events";
import HideProtectedProperties = require("hide-protected-properties");
import get = require('lodash/get');
import { Queue } from "dynamic-queue";
import useThrottle from "@hyurl/utils/useThrottle";

/**
 * The `Service` class provides some useful functions like `i18n`, `logger`, 
 * `cache` that you can use to do real jobs, and since it is inherited from 
 * EventEmitter, you can bind customized events if needed.
 * 
 * This class is not intended to be used directly, to use its functions, a new
 * class must be defined and inherited from this one.
 */
@HideProtectedProperties
export abstract class Service extends EventEmitter {
    /**
     * The language of the current service, the default value is
     * `app.config.lang`, but for controllers, this property is set
     * automatically according to the client supported language.
     */
    lang: string = app.config.lang;

    private queues = new Map<any, Queue>();
    private gcTimer: NodeJS.Timer = null;

    /**
     * This method will be called automatically once the garbage collector ticks.
     */
    protected async gc(): Promise<void> {
        this.queues.forEach((queue, key) => {
            if (queue.length === 0) {
                queue.stop();
                this.queues.delete(key);
            }
        });
    }

    /** This method will be called automatically to initiate the service. */
    async init(): Promise<void> {
        this.gcTimer = setInterval(() => this.gc(), 1000 * 30);
    }

    /**
     * This method will be called automatically when the service is about to be
     * destroyed.
     */
    async destroy(): Promise<void> {
        this.gcTimer && clearInterval(this.gcTimer);
        await this.gc();
    }

    /**
     * Gets a locale text according to i18n. 
     * 
     * If it's an HTTP request, check `req.query.lang` or `req.cookies.lang`, if 
     * it's a socket message, check `socket.cookies.lang`, if any appears, then 
     * always use the setting language, otherwise, check header 
     * `Accept-Language` instead. Language files are stored in `src/locales/`.
     * 
     * @param text The original text, accept format with %s, %i, etc.
     * @param replacements Values that replace %s, %i, etc. in the `text`.
     */
    i18n(text: string, ...replacements: string[]): string {
        let trans = get(app.locales.translations, this.lang) ||
            get(app.locales.translations, app.config.lang);
        let stmt = trans[text] || text;

        return util.format(stmt, ...replacements);
    }

    /**
     * Uses throttle strategy on the given resource, if a subsequent call
     * happens within the `interval` time, the previous result will be returned
     * and the current `handle` function will not be invoked.
     * 
     * NOTE: this function only uses `interval` once for creating the internal
     * throttle function.
     * @param interval default `1000`.
     */
    async throttle<T>(resource: any, handle: () => T | Promise<T>, interval = 1000) {
        return useThrottle(resource, interval)(handle);
    }

    /**
     * Uses queue strategy on the given resource, any subsequent call will be
     * queued until the previous one finishes.
     */
    async queue<T>(resource: any, handle: () => T | Promise<T>) {
        return new Promise<T>((resolve, reject) => {
            let queue = this.queues.get(resource);

            if (!queue) {
                this.queues.set(resource, queue = new Queue());
            }

            queue.push(async () => {
                try {
                    resolve(await handle.call(this));
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
}
