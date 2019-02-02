"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const modelar = require("modelar");
const init_1 = require("../../init");
const functions_inner_1 = require("../tools/functions-inner");
function isUser(m) {
    return m && m.prototype instanceof modelar.User;
}
var UserClass = null;
let moduleName = init_1.APP_PATH + "/models/User";
if (functions_inner_1.moduleExists(moduleName)) {
    let _module = require(moduleName);
    if (isUser(_module.default)) {
        UserClass = _module.default;
    }
    else if (isUser(_module.User)) {
        UserClass = _module.User;
    }
    else if (isUser(_module)) {
        UserClass = _module;
    }
}
else {
    UserClass = modelar.User;
}
exports.User = UserClass;
//# sourceMappingURL=load-user.js.map