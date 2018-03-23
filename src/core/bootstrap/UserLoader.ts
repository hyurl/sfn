import * as fs from "fs";
import * as modelar from "modelar";
import { APP_PATH } from '../../init';

namespace UserLoader {
    export var User: typeof modelar.User = null;

    function isUser(m): boolean {
        return m && m.prototype instanceof modelar.User;
    }

    let file = APP_PATH + "/models/User.js";
    if (fs.existsSync(file)) {
        let _module = require(file);

        if (isUser(_module)) {
            User = _module;
        } else if (isUser(_module.User)) {
            User = _module.User;
        } else if (isUser(_module.default)) {
            User = _module.default;
        }
    } else {
        User = modelar.User;
    }
}

export = UserLoader;