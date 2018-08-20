"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
var Service_1;
const util = require("util");
const events_1 = require("events");
const Cache = require("sfn-cache");
const Logger = require("sfn-logger");
const modelar_1 = require("modelar");
const injectable_ts_1 = require("injectable-ts");
const HideProtectedProperties = require("hide-protected-properties");
const init_1 = require("../../init");
const ConfigLoader_1 = require("../bootstrap/ConfigLoader");
const LocaleMap_1 = require("./LocaleMap");
injectable_ts_1.injectable(Cache);
injectable_ts_1.injectable(modelar_1.DB);
;
exports.LogOptions = Object.assign({}, Logger.Options, {
    ttl: 1000,
    filename: init_1.ROOT_PATH + "/logs/sfn.log",
    fileSize: 1024 * 1024 * 2,
    action: "default"
});
let Service = Service_1 = class Service extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.lang = ConfigLoader_1.config.lang;
        this.logOptions = Object.assign({}, exports.LogOptions, {
            action: this.constructor.name
        });
        this.logConfig = this.logOptions;
    }
    i18n(text, ...replacements) {
        var locale = LocaleMap_1.LocaleMap, lang = this.lang.toLowerCase(), _lang = ConfigLoader_1.config.lang.toLowerCase();
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
};
Service.Loggers = {};
tslib_1.__decorate([
    injectable_ts_1.injected([ConfigLoader_1.config.redis]),
    tslib_1.__metadata("design:type", Cache)
], Service.prototype, "cache", void 0);
tslib_1.__decorate([
    injectable_ts_1.injected([ConfigLoader_1.config.database]),
    tslib_1.__metadata("design:type", modelar_1.DB)
], Service.prototype, "db", void 0);
Service = Service_1 = tslib_1.__decorate([
    injectable_ts_1.injectable,
    HideProtectedProperties
], Service);
exports.Service = Service;
//# sourceMappingURL=Service.js.map