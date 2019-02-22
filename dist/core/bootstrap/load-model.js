"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alar = require("alar");
const init_1 = require("../../init");
global["app"].models = new alar.ModuleProxy("models", init_1.APP_PATH + "/models");
//# sourceMappingURL=load-model.js.map