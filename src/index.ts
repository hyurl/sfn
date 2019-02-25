// Force the console to output colorfully.
process.env.FORCE_COLOR = "10";

let isTsNode = process.execArgv.join(" ").includes("ts-node");
let isMain = process.mainModule.filename === __filename;

!isTsNode && require("source-map-support/register");

import "reflect-metadata";
import * as Mail from "sfn-mail";
import * as Logger from "sfn-logger";
import * as SSE from "sfn-sse";

export { Mail, Logger, SSE };
export { Cookie, CookieOptions } from "sfn-cookie";
export * from "sfn-xss";
export * from "./init";
export * from "./config";
export * from "./core/tools/interfaces";
export * from "./core/tools/HttpError";
export * from "./core/tools/SocketError";

// load user config before loading subsequent modules
export { config } from "./core/bootstrap/load-config";

isMain && require("./bootstrap/rpc-config");

export * from "./core/tools/Plugin";
export * from "./core/tools/Service";
export * from "./core/controllers/HttpController";
export * from "./core/controllers/WebSocketController";
export * from "./core/bootstrap/index";
export * from "./core/tools/functions";
export * from "./core/tools/upload";

isMain && app.serve().then(app.rpc.connectAll);