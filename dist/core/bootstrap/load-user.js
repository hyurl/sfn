"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modelar = require("modelar");
const init_1 = require("../../init");
const functions_inner_1 = require("../tools/functions-inner");
const tryImport = functions_inner_1.createImport(require);
var UserClass = null;
function isUser(m) {
    return m && m.prototype instanceof modelar.User;
}
let moduleName = init_1.APP_PATH + "/models/User";
if (functions_inner_1.moduleExists(moduleName)) {
    let module = tryImport(moduleName);
    if (isUser(module.default)) {
        UserClass = module.default;
    }
    else if (isUser(module.User)) {
        UserClass = module.User;
    }
}
else {
    UserClass = modelar.User;
}
exports.User = UserClass;
//# sourceMappingURL=load-user.js.map