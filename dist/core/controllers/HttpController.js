"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const sfn_ejs_engine_1 = require("sfn-ejs-engine");
const SSE = require("sfn-sse");
const init_1 = require("../../init");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const Controller_1 = require("./Controller");
const MarkdownParser_1 = require("../tools/MarkdownParser");
const symbols_1 = require("../tools/symbols");
const upload_1 = require("../tools/upload");
const Engine = new sfn_ejs_engine_1.EjsEngine();
class HttpController extends Controller_1.Controller {
    constructor(req, res) {
        super();
        this.viewPath = this.Class.viewPath;
        this.viewExtname = this.Class.viewExtname;
        this.engine = this.Class.engine;
        this.gzip = true;
        this.jsonp = false;
        this.csrfProtection = false;
        this.cors = false;
        this.uploadOptions = Object.assign({}, upload_1.UploadOptions);
        this.authorized = req.user !== null;
        this.req = req;
        this.res = res;
        this.lang = (req.query && req.query.lang)
            || (req.cookies && req.cookies.lang)
            || req.lang
            || ConfigLoader_1.config.lang;
    }
    getAbsFilename(filename) {
        if (!path.isAbsolute(filename))
            filename = `${this.viewPath}/${filename}`;
        return filename;
    }
    view(filename, vars = {}) {
        let ext = path.extname(filename);
        if (ext != this.viewExtname) {
            ext = this.viewExtname;
            filename += ext;
        }
        filename = this.getAbsFilename(filename);
        this.res.type = ext;
        if (!("i18n" in vars)) {
            vars.i18n = function i18n(text, ...replacements) {
                return this.i18n(text, ...replacements);
            };
        }
        return this.engine.renderFile(filename, vars);
    }
    viewRaw(filename, cache = !ConfigLoader_1.isDevMode) {
        filename = this.getAbsFilename(filename);
        this.res.type = path.extname(filename);
        if (cache && this.Class.LoadedViews[filename] !== undefined) {
            return Promise.resolve(this.Class.LoadedViews[filename]);
        }
        else {
            return fs.readFile(filename, "utf8").then(content => {
                if (cache)
                    this.Class.LoadedViews[filename] = content;
                return content;
            });
        }
    }
    viewMarkdown(filename, cache = !ConfigLoader_1.isDevMode) {
        if (path.extname(filename) != ".md")
            filename += ".md";
        return this.viewRaw(filename, cache).then(MarkdownParser_1.MarkdownParser.parse);
    }
    send(data) {
        return this.res.send(data);
    }
    get Class() {
        return this.constructor;
    }
    get db() {
        return this.req.db;
    }
    set db(v) {
        this.req.db = v;
    }
    get session() {
        return this.req.session;
    }
    get user() {
        return this.req.user;
    }
    set user(v) {
        this.req.user = v;
    }
    get sse() {
        if (!this[symbols_1.realSSE]) {
            this[symbols_1.realSSE] = new SSE(this.req, this.res);
        }
        return this[symbols_1.realSSE];
    }
    get isEventSource() {
        return this.req.isEventSource;
    }
    get csrfToken() {
        return this.req.csrfToken;
    }
    static httpErrorView(err, instance) {
        return instance.view(instance.res.code.toString(), { err });
    }
}
HttpController.viewPath = init_1.SRC_PATH + "/views";
HttpController.viewExtname = ".html";
HttpController.engine = Engine;
HttpController.UploadFields = {};
HttpController.LoadedViews = {};
exports.HttpController = HttpController;
//# sourceMappingURL=HttpController.js.map