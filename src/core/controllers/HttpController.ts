import * as path from "path";
import get = require('lodash/get');
import { CorsOption as CorsOptions } from "sfn-cors";
import { SRC_PATH } from "../../init";
import { Controller, ResultMessage } from "./Controller";
import { Request, Response, Session, View } from "../tools/interfaces";
import { StatusException } from "../tools/StatusException";
import { UploadOptions } from "../tools/upload";

export { CorsOptions };

/**
 * HttpController manages requests come from an HTTP client.
 * 
 * When a request fires, the controller will be automatically instantiated and
 * calling the binding method according to the route.
 * 
 * The parameters of the URL route will be stored in `req.params`, and they 
 * will be auto-injected into the method (as method parameters) accordingly. 
 * Apart from them, you can set `req: Request` and `res: Response` as 
 * parameters as well, they will be auto-injected too, and the sequence and 
 * position of them is arbitrary. Or you can call them from `this`:
 * 
 * `let { req, res } = this;`
 * 
 * You may `return` some data inside a method that bound to a certain route, 
 * when the method is called by a HTTP request, they will be automatically 
 * sent to the client. Actions will be handled in a Promise constructor, so 
 * you can do what ever you want inside the method. Using `async` methods to 
 * do asynchronous operations is recommended.
 * 
 * If you want to send a response manually, you can just call the `res.send()`
 * or `res.end()` to do so, no more data will be sent after sending one.
 */
export class HttpController extends Controller {
    /** Sets a specified base URI for route paths. */
    static baseURI: string;

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
    /** Whether the response data should be compressed to GZip. */
    gzip: boolean = true;
    /**
     * Sets a query name for jsonp callback, `false` (by default) to disable.
     */
    jsonp: string | false = false;
    /**
     * If `true`, when request method is `DELETE`, `PATCH`, `POST` or `PUT`, 
     * the client must send an `x-csrf-token` field to the server either via 
     * request header, URL query string or request body. You can call 
     * `req.csrfToken` to get the auto-generated token in a `GET` action and 
     * pass it to a view.
     */
    csrfProtection: boolean = false;
    /** Configurations for uploading files. */
    uploadOptions: UploadOptions = Object.assign({}, UploadOptions);
    /** Reference to the corresponding request context. */
    readonly req: Request;
    /** Reference to the corresponding response context. */
    readonly res: Response;

    constructor(req: Request, res: Response) {
        super();
        this.req = req;
        this.res = res;
        this.lang = (req.query && req.query.lang)
            || (req.cookies && req.cookies.lang)
            || req.lang
            || app.config.lang;
    }

    /** Gets the absolute view filename if the given one is relative. */
    protected getAbsFilename(filename: string): string {
        if (!path.isAbsolute(filename))
            filename = path.resolve(SRC_PATH, "views", filename);
        return filename;
    }

    /**
     * Sends view contents to the response context.
     * 
     * @param path The template path (without extension) related to `src/views`.
     * @param vars Local variables passed to the template.
     */
    view(path: string, vars: { [name: string]: any } = {}) {
        path = this.getAbsFilename(path);

        // i18n support for the template.
        if (!("i18n" in vars)) {
            vars.i18n = (text: string, ...replacements: string[]) => {
                return this.i18n(text, ...replacements);
            };
        }

        try {
            let view: ModuleProxy<View> = get(global, app.views.resolve(path));

            this.res.type = "text/html";

            return view(path).render(vars);
        } catch (err) {
            if (err instanceof TypeError)
                throw new StatusException(404);
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
     * code, and only pass the `err: StatusException` object to the template, it
     * may not be suitable for complicated needs. For such a reason, the 
     * framework allows you to customize the error view handler by rewriting 
     * this method.
     */
    static httpErrorView(err: StatusException, instance: HttpController) {
        return instance.view(String(err.code), { err });
    }
}