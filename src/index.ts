// Force the console to output colorfully.
process.env.FORCE_COLOR = "10";

import "source-map-support/register";
import "reflect-metadata";
import * as Mail from "sfn-mail";
import * as Logger from "sfn-logger";
import * as Validator from "sfn-validator";
import * as SSE from "sfn-sse";
import Cache = require("sfn-cache");

export { Mail, Logger, Validator, SSE, Cache };
export { Cookie, CookieOptions } from "sfn-cookie";
export * from "sfn-scheduler";
export * from "sfn-xss";
export * from "./init";
export * from "./config";
export * from "./core/tools/interfaces";
export * from "./core/tools/functions";
export * from "./core/tools/HttpError";
export * from "./core/tools/SocketError";
export * from "./core/tools/MarkdownParser";
export * from "./core/tools/upload";

// load user config before loading subsequent modules
export * from "./core/bootstrap/ConfigLoader";

export * from "./core/tools/Service";
export * from "./core/tools/TemplateEngine";
export * from "./core/controllers/HttpController";
export * from "./core/controllers/WebSocketController";
export * from "./core/bootstrap/index";