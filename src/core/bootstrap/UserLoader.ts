import * as fs from "fs";
import * as modelar from "modelar";
import { APP_PATH } from '../../init';

function isUser(m): boolean {
    return m && m.prototype instanceof modelar.User;
}

var UserClass: typeof modelar.User = null;

let file = APP_PATH + "/models/User.js";
if (fs.existsSync(file)) {
    let _module = require(file);

    if (isUser(_module)) {
        UserClass = _module;
    } else if (isUser(_module.User)) {
        UserClass = _module.User;
    } else if (isUser(_module.default)) {
        UserClass = _module.default;
    }
} else {
    UserClass = modelar.User;
}

export const User = UserClass;