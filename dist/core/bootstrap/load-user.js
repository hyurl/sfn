"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modelar = require("modelar");
const init_1 = require("../../init");
const functions_inner_1 = require("../tools/functions-inner");
const tryImport = functions_inner_1.createImport(require);
var UserCtor = null;
function isUser(m) {
    return m && m.prototype instanceof modelar.User;
}
let moduleName = init_1.APP_PATH + "/models/User";
if (functions_inner_1.moduleExists(moduleName)) {
    let mod = tryImport(moduleName);
    if (isUser(mod.default)) {
        UserCtor = mod.default;
    }
    else if (isUser(mod.User)) {
        UserCtor = mod.User;
    }
}
else {
    UserCtor = modelar.User;
}
exports.User = UserCtor;
//# sourceMappingURL=load-user.js.map