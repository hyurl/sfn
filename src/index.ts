// Force the console to output colorfully.
process.env.FORCE_COLOR = "10";

let isTsNode = process.execArgv.join(" ").includes("ts-node");
!isTsNode && require("source-map-support/register");

import "reflect-metadata";
import * as Mail from "sfn-mail";
import * as Logger from "sfn-logger";
import * as Validator from "sfn-validator";
import * as SSE from "sfn-sse";

export { Mail, Logger, Validator, SSE };
export { Cookie, CookieOptions } from "sfn-cookie";
export * from "sfn-scheduler";
export * from "sfn-xss";
export * from "./init";
export * from "./config";
export * from "./core/tools/interfaces";
export * from "./core/tools/HttpError";
export * from "./core/tools/SocketError";
export * from "./core/tools/MarkdownParser";

// load user config before loading subsequent modules
export * from "./core/bootstrap/load-config";

export * from "./core/tools/Service";
export * from "./core/tools/TemplateEngine";
export * from "./core/controllers/HttpController";
export * from "./core/controllers/WebSocketController";
export * from "./core/bootstrap/index";
export * from "./core/tools/functions";
export * from "./core/tools/upload";

if (process.mainModule.filename === __filename) {
    app.serve();
}