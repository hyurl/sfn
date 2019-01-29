"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
var Service_1;
const util = require("util");
const path = require("path");
const events_1 = require("events");
const cluster_storage_1 = require("cluster-storage");
const Logger = require("sfn-logger");
const modelar_1 = require("modelar");
const injectable_ts_1 = require("injectable-ts");
const HideProtectedProperties = require("hide-protected-properties");
const init_1 = require("../../init");
const load_config_1 = require("../bootstrap/load-config");
const LocaleMap_1 = require("./LocaleMap");
injectable_ts_1.injectable(modelar_1.DB);
exports.LogOptions = Object.assign({}, Logger.Options, {
    ttl: 1000,
    filename: init_1.ROOT_PATH + "/logs/sfn.log",
    fileSize: 1024 * 1024 * 2,
    trace: true
});
exports.CacheOptions = {
    name: "sfn",
    path: init_1.ROOT_PATH,
    gcInterval: 120000
};
let Service = Service_1 = class Service extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.lang = load_config_1.config.lang;
        this.logOptions = Object.assign({}, exports.LogOptions);
        this.cacheOptions = Object.assign({}, exports.CacheOptions);
    }
    i18n(text, ...replacements) {
        var locale = LocaleMap_1.LocaleMap, lang = this.lang.toLowerCase(), _lang = load_config_1.config.lang.toLowerCase();
        if (locale[lang] && locale[lang][text]) {
            text = locale[lang][text];
        }
        else if (locale[_lang] && locale[_lang][text]) {
            text = locale[_lang][text];
        }
        return util.format(text, ...replacements);
    }
    get logger() {
        let filename = this.logOptions.filename || exports.LogOptions.filename;
        if (!Service_1.Loggers[filename]) {
            let options = Object.assign({}, exports.LogOptions, this.logOptions);
            Service_1.Loggers[filename] = new Logger(options);
        }
        return Service_1.Loggers[filename];
    }
    get cache() {
        let { path: dirname, name } = this.cacheOptions;
        let filename = path.resolve(dirname, name + ".db");
        if (!Service_1.Caches[filename]) {
            Service_1.Caches[filename] = new cluster_storage_1.Storage(name, this.cacheOptions);
        }
        return Service_1.Caches[filename];
    }
};
Service.Loggers = {};
Service.Caches = {};
tslib_1.__decorate([
    injectable_ts_1.injected([load_config_1.config.database]),
    tslib_1.__metadata("design:type", modelar_1.DB)
], Service.prototype, "db", void 0);
Service = Service_1 = tslib_1.__decorate([
    injectable_ts_1.injectable,
    HideProtectedProperties
], Service);
exports.Service = Service;
//# sourceMappingURL=Service.js.map