"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alar_1 = require("alar");
const init_1 = require("../../init");
const get = require("lodash/get");
function loadView(type, filename) {
    let loader = app.views[type];
    if (!loader)
        return null;
    return get(loader, loader.resolve(filename));
}
exports.loadView = loadView;
global["app"]["views"] = {
    register(loader) {
        var proxy = new alar_1.ModuleProxy("views", init_1.SRC_PATH + "/views");
        proxy.setLoader(loader);
        app.views[loader.extesion.slice(1)] = proxy;
    }
};
//# sourceMappingURL=view.js.map