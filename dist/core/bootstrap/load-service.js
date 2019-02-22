"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alar = require("alar");
const init_1 = require("../../init");
global["app"].services = new alar.ModuleProxy("services", init_1.APP_PATH + "/services");
//# sourceMappingURL=load-service.js.map