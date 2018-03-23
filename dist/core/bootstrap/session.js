"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Session = require("express-session");
const init_1 = require("../../init");
exports.session = Session(init_1.config.session);
//# sourceMappingURL=session.js.map