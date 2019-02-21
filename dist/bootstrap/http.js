"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sfn_1 = require("sfn");
const sfn_ejs_loader_1 = require("sfn-ejs-loader");
sfn_1.HttpController.viewExtname = ".ejs";
app.views.register(new sfn_ejs_loader_1.EjsLoader());
//# sourceMappingURL=http.js.map