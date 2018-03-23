"use strict";
const fs = require("fs");
const modelar = require("modelar");
const init_1 = require("../../init");
var UserLoader;
(function (UserLoader) {
    UserLoader.User = null;
    function isUser(m) {
        return m && m.prototype instanceof modelar.User;
    }
    let file = init_1.APP_PATH + "/models/User.js";
    if (fs.existsSync(file)) {
        let _module = require(file);
        if (isUser(_module)) {
            UserLoader.User = _module;
        }
        else if (isUser(_module.User)) {
            UserLoader.User = _module.User;
        }
        else if (isUser(_module.default)) {
            UserLoader.User = _module.default;
        }
    }
    else {
        UserLoader.User = modelar.User;
    }
})(UserLoader || (UserLoader = {}));
module.exports = UserLoader;
//# sourceMappingURL=UserLoader.js.map