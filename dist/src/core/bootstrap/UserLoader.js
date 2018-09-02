"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const modelar = require("modelar");
const init_1 = require("../../init");
function isUser(m) {
    return m && m.prototype instanceof modelar.User;
}
var UserClass = null;
let file = init_1.APP_PATH + "/models/User.js";
if (fs.existsSync(file)) {
    let _module = require(file);
    if (isUser(_module)) {
        UserClass = _module;
    }
    else if (isUser(_module.User)) {
        UserClass = _module.User;
    }
    else if (isUser(_module.default)) {
        UserClass = _module.default;
    }
}
else {
    UserClass = modelar.User;
}
exports.User = UserClass;
//# sourceMappingURL=UserLoader.js.map