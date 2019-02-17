"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get = require("lodash/get");
const modelar = require("modelar");
function loadUser() {
    let ctor;
    try {
        ctor = get(app, "models.user").ctor;
        if (!(ctor.prototype instanceof modelar.User)) {
            ctor = modelar.User;
        }
    }
    catch (err) {
        ctor = modelar.User;
    }
    return ctor;
}
exports.loadUser = loadUser;
//# sourceMappingURL=load-user.js.map