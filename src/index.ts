require("../env-fix");

if (!process.execArgv.join(" ").includes("ts-node")) {
    require("source-map-support/register");
}

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

export * from "./core/tools/interfaces";
export * from "./core/tools/StatusException";
export * from "./core/tools/decorators";
export * from "./core/tools/functions";
export * from "./core/tools/upload";
export * from "./core/tools/Hook";
export * from "./core/tools/Schedule";
export * from "./core/tools/Service";
export * from "./core/tools/MessageChannel";
export * from "./core/controllers/Controller";
export * from "./core/controllers/HttpController";
export * from "./core/controllers/WebSocketController";
export * from "./core/bootstrap/index";

import config, { StaticOptions } from "./config";
import { tryLogError } from './core/tools/functions';
export { StaticOptions };

global.app.config = config;

if (require.main.filename === __filename) {
    require("./core/tools/internal/module").bootstrap();

    (async () => {
        let appId: string = app.argv["app-id"] || app.argv._[2];

        if (appId) {
            await app.serve(appId);
        } else {
            await app.serve();
        }
    })().catch(err => {
        return tryLogError(err);
    });
}