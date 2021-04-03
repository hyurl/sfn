import get = require('lodash/get');
import { isAbsolute, resolve } from "path";
import { ModuleProxy } from "microse";
import { CorsOption as CorsOptions } from "sfn-cors";
import { SRC_PATH } from "../../init";
import { Controller, ResultMessage } from "./Controller";
import { Request, Response, Session, View } from "../tools/interfaces";
import { HttpException } from "../tools/HttpException";
import { UploadOptions } from "../tools/upload";

export { CorsOptions };

/**
 * HttpController manages requests come from an HTTP client.
 * 
 * When a request fires, the controller will be automatically instantiated and
 * calling the bound method according to the route.
 */
export class HttpController extends Controller {
    /** Sets a specified base URI for route paths. */
    static baseURI: string = "/";

    /**
     * Enables Cross-Origin Resource Sharing, set an array to accept multiple 
     * origins, an `*` to accept all, or an object for more complicated needs.
     */
    static cors: string | string[] | CorsOptions = null;

    /**
     * If set, when unauthorized, fallback to the given URL or response an
     * error message.
     */
    fallbackTo: string | ResultMessage;
    /**
     * Whether the response data should be compressed to GZip, default `true`.
     */
    gzip: boolean = true;
    /**
     * Sets a query name for jsonp callback, or `false` (by default) to disable.
     */
    jsonp: string | false = false;
    /**
     * If `true`, when the request method is `DELETE`, `PATCH`, `POST` or `PUT`, 
     * the client must send an `x-csrf-token` field to the server either via 
     * request header, URL query string or request body. You can call 
     * `req.csrfToken` to get the auto-generated token in a `GET` action and 
     * pass it to a view.
     */
    csrfProtection: boolean = false;
    /** Configurations for uploading files. */
    uploadOptions: UploadOptions = Object.assign({}, UploadOptions);

    constructor(
        /** The current request context. */
        readonly req: Request,
        /** The current response context. */
        readonly res: Response
    ) {
        super();
        this.lang = (req.query && req.query.lang)
            || (req.cookies && req.cookies.lang)
            || req.lang
            || app.config.lang;
    }

    /**
     * Renders the template file to a string.
     * 
     * @param path The template path (without extension) related to `src/views`.
     * @param vars Local variables passed into the template.
     */
    view(path: string, vars: { [name: string]: any; } = {}) {
        if (!isAbsolute(path))
            path = resolve(SRC_PATH, "views", path);

        // i18n support for the template.
        if (!("i18n" in vars)) {
            vars.i18n = (text: string, ...replacements: string[]) => {
                return this.i18n(text, ...replacements);
            };
        }

        try {
            this.res.type = "text/html";
            let view: ModuleProxy<View> = get(global, app.views.resolve(path));
            return view?.render(vars);
        } catch (err) {
            if (err instanceof TypeError)
                throw new HttpException(404);
            else
                throw err;
        }
    }

    /** Alias of `res.send()`. */
    send(data: any): void {
        return this.res.send(data);
    }

    /** Alias of `req.session`. */
    get session(): Session {
        return this.req.session;
    }

    /** Alias of `req.url`. */
    get url(): string {
        return this.req.url;
    }

    /** Gets an SSE instance. */
    get sse() {
        return this.res.sse;
    }

    /**
     * Whether the request comes from an EventSource. Will check the header
     * field `accept`, see if it's `text/event-stream`, some clients may not
     * set this right, so be careful to use.
     */
    get isEventSource(): boolean {
        return this.req.isEventSource;
    }

    /** Alias of `req.csrfToken`. */
    get csrfToken(): string {
        return this.req.csrfToken;
    }

    /**
     * By default, the framework will send a view file according to the error 
     * code, and only pass the `err: HttpException` object into the template, it
     * may not be suitable for complicated needs. For such a reason, the 
     * framework allows you to customize the error view handler by rewriting 
     * this method.
     */
    static httpErrorView(err: HttpException, instance: HttpController) {
        return instance.view(String(err.code), { err });
    }
}
