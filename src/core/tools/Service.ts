import * as util from "util";
import { EventEmitter } from "events";
import HideProtectedProperties = require("hide-protected-properties");
import get = require('lodash/get');
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

    private throttles = new Map<string, number>();
    private queues = new Map<string, Queue>();
    private gcTimer: NodeJS.Timer = null;

    protected async gc(): Promise<void> {
        let now = Date.now();

        this.throttles.forEach((time, key) => {
            if (time < now) {
                this.throttles.delete(key);
            }
        });

        this.queues.forEach((queue, key) => {
            if (queue.length === 0) {
                queue.stop();
                this.queues.delete(key);
            }
        });
    }

    /** This method will be called to initiate the service. */
    async init(): Promise<void> {
        this.gcTimer = setInterval(() => this.gc(), 1000 * 30);
    }

    /**
     * This method will be called when the service is about to be destroyed.
     */
    async destroy(): Promise<void> {
        this.gcTimer && clearInterval(this.gcTimer);
        await this.gc();
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
        let trans = get(app.locales.translations, this.lang) ||
            get(app.locales.translations, app.config.lang);
        let stmt = trans[text] || text;

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
        return new Promise<T>((resolve, reject) => {
            let now = Date.now();

            if ((this.throttles.get(key) || 0) >= now) {
                return reject(error);
            } else {
                this.throttles.set(key, now + interval);
                resolve(body.call(this));
            }
        });
    }

    /**
     * Queues the operation in the body associated to a unique key.
     */
    async queue<T>(key: string, body: () => T | Promise<T>) {
        return new Promise<T>((resolve, reject) => {
            let queue = this.queues.get(key);

            if (!queue) {
                this.queues.set(key, queue = new Queue());
            }

            queue.push(async () => {
                try {
                    resolve(await body.call(this));
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
}