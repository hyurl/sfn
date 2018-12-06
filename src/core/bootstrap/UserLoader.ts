import * as fs from "fs";
import * as modelar from "modelar";
import { APP_PATH } from '../../init';
import { moduleExists } from '../tools/functions-inner';

function isUser(m): boolean {
    return m && m.prototype instanceof modelar.User;
}

var UserClass: typeof modelar.User = null;

let moduleName = APP_PATH + "/models/User";
if (moduleExists(moduleName)) {
    let _module = require(moduleName);

    if (isUser(_module.default)) {
        UserClass = _module.default;
    } else if (isUser(_module.User)) {
        UserClass = _module.User;
    } else if (isUser(_module)) {
        UserClass = _module;
    }
} else {
    UserClass = modelar.User;
}

export const User = UserClass;