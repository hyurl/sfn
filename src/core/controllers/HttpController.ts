import * as path from "path";
import * as fs from "fs-extra";
import { DB, User } from "modelar";
import { EjsEngine } from "sfn-ejs-engine";
import * as SSE from "sfn-sse";
import { CorsOption as CorsOptions } from "sfn-cors";
import { SRC_PATH, ROOT_PATH } from "../../init";
import { config } from "../bootstrap/ConfigLoader";
import { Controller } from "./Controller";
import { TemplateEngine } from "../tools/TemplateEngine";
import { MarkdownParser } from "../tools/MarkdownParser";
import { Request, Response, Session } from "../tools/interfaces";
import { HttpError } from "../tools/HttpError";
import { realSSE } from "../tools/symbols";

export { CorsOptions };

const Engine = new EjsEngine();

export type HttpNextHandler = (controller: HttpController) => void;

export type UploadOptions = {
    /** Maximum number of files that each form field can carry. */
    maxCount: number;
    /** A path in the disk that stores the uploaded files. */
    savePath: string;
    /** Returns `true` to accept, `false` to reject. */
    filter: (file: UploadingFile) => boolean;
    /** `auto-increment`, `random` or a function returns the filename. */
    filename: "auto-increment" | "random" | ((file: UploadingFile) => string);
};

export const UploadOptions: UploadOptions = {
    maxCount: 1,
    savePath: ROOT_PATH + "/uploads",
    filter: (file) => file && file.size !== undefined,
    filename: "auto-increment"
};

export interface UploadingFile {
    /** Field name specified in the form. */
    fieldname: string;
    /** Name of the file on the user's computer. */
    originalname: string;
    /** Encoding type of the file. */
    encoding: string;
    /** Mime type of the file. */
    mimetype: string;
    /** Size of the file in bytes. */
    size: number;
}

export interface UploadedFile extends UploadingFile {
    /** The folder to which the file has been saved. */
    destination: string;
    /** The name of the file within the destination. */
    filename: string;
    /** Location of the uploaded file. */
    path: string;
}

/**
 * HttpController manages requests come from a HTTP client.
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
 * 
 * The decorator function `@route()` is used to set routes. But when you're 
 * coding in JavaScript, there is not decorators, the framework support 
 * another compatible way to allow you doing such things by using the 
 * **jsdoc** block with a `@route` tag, but you need to set 
 * `config.enableDocRoute` to `true`.
 */
export class HttpController extends Controller {
    static viewPath: string = SRC_PATH + "/views";
    static viewExtname: string = ".html";
    static engine: TemplateEngine = Engine;
    /** Sets a specified base URI for route paths. */
    static baseURI: string;
    /**
     * The key represents the method name, and the value sets form fields.
     */
    static UploadFields: {
        [method: string]: string[]
    } = {};

    viewPath = this.Class.viewPath;
    viewExtname = this.Class.viewExtname;
    /** Sets a specified template engine for the controller. */
    engine = this.Class.engine;

    /** If set, when unauthorized, fallback to the given URL. */
    fallbackTo: string;
    /** Whether the response data should be compressed to GZip. */
    gzip: boolean = true;
    /**
     * Sets a query name for jsonp callback, `false` (by default) to disable.
     */
    jsonp: string | false = false;
    /**
     * If `true`, when request method is `DELETE`, `PATCH`, `POST` or `PUT`, 
     * the client must send a `x-csrf-token` field to the server either via 
     * request header, URL query string or request body. You can call 
     * `req.csrfToken` to get the auto-generated token in a `GET` action and 
     * pass it to a view.
     */
    csrfProtection: boolean = false;
    /**
     * Enables Cross-Origin Resource Sharing, set an array to accept multiple 
     * origins, an `*` to accept all, or an object for more complicated needs.
     */
    cors: string | string[] | CorsOptions | false = false;
    /** Configurations for uploading files. */
    uploadOptions: UploadOptions = Object.assign({}, UploadOptions);
    /** `deprecated`, use `uploadOptions` instead. */
    uploadConfig: UploadOptions = this.uploadOptions;
    /** Reference to the corresponding request context. */
    readonly req: Request;
    /** Reference to the corresponding response context. */
    readonly res: Response;
    /** Whether the controller is initiated asynchronously. */
    readonly isAsync: boolean;

    /**
     * You can define a fourth parameter `next` to the constructor, if it is 
     * defined, then the constructor can handle asynchronous actions. And at 
     * where you want to call the real method, use `next(this)` to call it.
     */
    constructor(req: Request, res: Response, next: HttpNextHandler = null) {
        super();
        this.authorized = req.user !== null;
        this.req = req;
        this.res = res;
        this.isAsync = next instanceof Function;
        this.lang = (req.query && req.query.lang)
            || (req.cookies && req.cookies.lang)
            || req.lang
            || config.lang;
    }

    /** @private */
    private _realFilename(filename: string): string {
        if (!path.isAbsolute(filename))
            filename = `${this.viewPath}/${filename}`;
        return filename;
    }

    /**
     * Sends view contents to the response context.
     * 
     * @param filename The template name. Template files are stored in 
     *  `Views/`, if the filename ends with a `.html` as its extension 
     *  name, you can pass this argument without one. If this argument is 
     *  missing, then the `defaultView` will be used.
     * @param vars Local variables passed to the template.
     */
    view(filename: string, vars: { [name: string]: any } = {}): Promise<string> {
        let ext = path.extname(filename);
        if (ext != this.viewExtname) {
            ext = this.viewExtname;
            filename += ext;
        }
        filename = this._realFilename(filename);

        // Set response type.
        this.res.type = ext;

        // i18n support for the template.
        if (!("i18n" in vars)) {
            vars.i18n = function i18n(text, ...replacements) {
                return this.i18n(text, ...replacements);
            };
        }

        return this.engine.renderFile(filename, vars);
    }

    /**
     * Sends a view file to the response context, and parse it as a markdown 
     * file.
     * 
     * This method relies on the module `highlightjs`, so when displaying code 
     * snippets, you need to include CSS files to the HTML page manually.
     * 
     * @param filename The markdown filename. Template files are stored in 
     *  `Views/`, if the filename ends with a `.md` as its extension name,
     *  you can pass this argument without one. If this argument is missing, 
     *  then the `defaultView` will be used.
     */
    viewMarkdown(filename: string): Promise<string> {
        if (path.extname(filename) != ".md")
            filename += ".md";

        filename = this._realFilename(filename);
        this.res.type = ".md";
        return MarkdownParser.parseFile(filename);
    }

    /**
     * Sends a view file with raw contents to the response context.
     * 
     * @param filename The view filename. Template files are stored in 
     *  `Views/`. If this argument is missing, then the `defaultView` will
     *  be used.
     */
    viewRaw(filename: string): Promise<string> {
        filename = this._realFilename(filename);
        this.res.type = path.extname(filename);
        return fs.readFile(filename, "utf8");
    }

    /** Alias of `res.send()`. */
    send(data: any): void {
        return this.res.send(data);
    }

    /** A reference to the class object. */
    get Class(): typeof HttpController {
        return <any>this.constructor;
    }

    /** Gets/Sets the DB instance. */
    get db(): DB {
        return this.req.db;
    }

    set db(v: DB) {
        this.req.db = v;
    }

    /** Alias of `req.session`. */
    get session(): Session {
        return this.req.session;
    }

    /** Alias of `req.user`. */
    get user(): User {
        return this.req.user;
    }

    set user(v: User) {
        this.req.user = v;
    }

    /** Gets a SSE instance. */
    get sse(): SSE {
        if (!this[realSSE]) {
            this[realSSE] = new SSE(this.req, this.res);
        }
        return this[realSSE];
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
     * code, and only pass the `err` object to the template, it may not be 
     * suitable for complicated needs. For such a reason, the framework allows
     * you to customize the error view handler by rewriting this method.
     */
    static httpErrorView(err: HttpError, instance: HttpController): Promise<string> {
        return instance.view(instance.res.code.toString(), { err });
    }
}