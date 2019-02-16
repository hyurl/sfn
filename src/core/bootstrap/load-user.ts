import * as modelar from "modelar";
import { APP_PATH } from '../../init';
import { moduleExists, createImport } from '../tools/functions-inner';

const tryImport = createImport(require);
var UserCtor: typeof modelar.User = null;

function isUser(m): boolean {
    return m && m.prototype instanceof modelar.User;
}

let moduleName = APP_PATH + "/models/User";
if (moduleExists(moduleName)) {
    let mod = tryImport(moduleName);

    if (isUser(mod.default)) {
        UserCtor = mod.default;
    } else if (isUser(mod.User)) {
        UserCtor = mod.User;
    }
} else {
    UserCtor = modelar.User;
}

export const User = UserCtor;