"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Session = require("express-session");
const ConfigLoader_1 = require("./ConfigLoader");
exports.session = Session(ConfigLoader_1.config.session);
//# sourceMappingURL=session.js.map