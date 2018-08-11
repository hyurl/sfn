"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
var Service_1;
const util = require("util");
const events_1 = require("events");
const Cache = require("sfn-cache");
const Logger = require("sfn-logger");
const modelar_1 = require("modelar");
const HideProtectedProperties = require("hide-protected-properties");
const index_1 = require("../../index");
const LocaleMap_1 = require("./LocaleMap");
const symbols_1 = require("./symbols");
;
exports.LogOptions = Object.assign({}, Logger.Options, {
    ttl: 1000,
    filename: process.cwd() + "/logs/sfn.log",
    fileSize: 1024 * 1024 * 2,
    action: "default"
});
let Service = Service_1 = class Service extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.lang = index_1.config.lang;
        this.logOptions = Object.assign({}, exports.LogOptions, {
            action: this.constructor.name
        });
        this.logConfig = this.logOptions;
    }
    i18n(text, ...replacements) {
        var locale = LocaleMap_1.LocaleMap, lang = this.lang.toLowerCase(), _lang = index_1.config.lang.toLowerCase();
        if (locale[lang] && locale[lang][text]) {
            text = locale[lang][text];
        }
        else if (locale[_lang] && locale[_lang][text]) {
            text = locale[_lang][text];
        }
        return util.format(text, ...replacements);
    }
    get logger() {
        let filename = this.logOptions.filename;
        if (!Service_1.Loggers[filename]) {
            Service_1.Loggers[filename] = new Logger(this.logOptions);
        }
        Service_1.Loggers[filename].action = this.logOptions.action;
        return Service_1.Loggers[filename];
    }
    get cache() {
        if (!this[symbols_1.realCache]) {
            this[symbols_1.realCache] = new Cache(index_1.config.redis);
        }
        return this[symbols_1.realCache];
    }
    set cache(v) {
        this[symbols_1.realCache] = v;
    }
    get db() {
        if (!this[symbols_1.realDB]) {
            this[symbols_1.realDB] = new modelar_1.DB(index_1.config.database);
        }
        return this[symbols_1.realDB];
    }
    set db(v) {
        this[symbols_1.realDB] = v;
    }
};
Service.Loggers = {};
Service = Service_1 = tslib_1.__decorate([
    HideProtectedProperties
], Service);
exports.Service = Service;
//# sourceMappingURL=Service.js.map