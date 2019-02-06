import * as modelar from "modelar";
import { APP_PATH } from '../../init';
import { moduleExists, createImport } from '../tools/functions-inner';

const tryImport = createImport(require);
var UserClass: typeof modelar.User = null;

function isUser(m): boolean {
    return m && m.prototype instanceof modelar.User;
}

let moduleName = APP_PATH + "/models/User";
if (moduleExists(moduleName)) {
    let module = tryImport(moduleName);

    if (isUser(module.default)) {
        UserClass = module.default;
    } else if (isUser(module.User)) {
        UserClass = module.User;
    }
} else {
    UserClass = modelar.User;
}

export const User = UserClass;