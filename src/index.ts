require("../env-fix");

let isTsNode = process.execArgv.join(" ").includes("ts-node");
let isMain = process.mainModule.filename === __filename;

!isTsNode && require("source-map-support/register");

import "reflect-metadata";
export * from "sfn-xss";
export * from "./init";

// Import facilities before config so that them can be used in the config file.
import "./core/bootstrap/load-controllers";
import "./core/bootstrap/load-services";
import "./core/bootstrap/load-models";
import "./core/bootstrap/load-utils";
import "./core/bootstrap/load-views";
import "./core/bootstrap/load-locales";
import "./core/bootstrap/load-hooks";

// export { StaticOptions } from "./config";
export * from "./core/tools/interfaces";
export * from "./core/tools/StatusException";
export * from "./core/tools/functions";
export * from "./core/tools/upload";
export * from "./core/tools/Hook";
export * from "./core/tools/Schedule";
export * from "./core/tools/Service";
export * from "./core/tools/MessageChannel";
export * from "./core/controllers/HttpController";
export * from "./core/controllers/WebSocketController";
export * from "./core/bootstrap/index";

// load user config before loading user defined bootstrap logics.
import "./core/bootstrap/load-config";

import { pathExists } from "fs-extra";
import { moduleExists, createImport } from './core/tools/functions';
import { importDirectory } from './core/tools/internal/module';

if (!app.isCli) {
    // Load user-defined bootstrap procedures.
    const tryImport = createImport(require);
    let bootstrap = app.APP_PATH + "/bootstrap/index";

    moduleExists(bootstrap) && tryImport(bootstrap);

    // load hooks
    pathExists(app.hooks.path).then(async (exists) => {
        exists && (await importDirectory(app.hooks.path));
    });
}

isMain && app.serve().then(() => app.rpc.connectAll(true));