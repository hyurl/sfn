"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Session = require("express-session");
const crc_1 = require("crc");
const ConfigLoader_1 = require("./ConfigLoader");
exports.session = Session(ConfigLoader_1.config.session);
function getHash(session) {
    return crc_1.crc32(JSON.stringify(session, (k, v) => {
        return k !== "cookie" ? v : undefined;
    }));
}
exports.getHash = getHash;
//# sourceMappingURL=session.js.map