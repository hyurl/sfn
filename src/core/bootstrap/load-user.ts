import get = require("lodash/get");
import * as modelar from "modelar";

export function loadUser() {
    let ctor: typeof modelar.User;

    try {
        ctor = get(app, "models.user").ctor;

        if (!ctor || !(ctor.prototype instanceof modelar.User)) {
            ctor = modelar.User;
        }
    } catch (err) {
        ctor = modelar.User;
    }

    return ctor;
}