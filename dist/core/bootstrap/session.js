"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExpressSession = require("express-session");
const ConfigLoader_1 = require("./ConfigLoader");
exports.session = ExpressSession(ConfigLoader_1.config.session);
//# sourceMappingURL=session.js.map