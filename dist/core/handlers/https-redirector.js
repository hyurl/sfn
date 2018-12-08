"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const load_config_1 = require("../bootstrap/load-config");
const functions_inner_1 = require("../tools/functions-inner");
const init_1 = require("../../init");
let server = load_config_1.config.server.http;
if (server.type == "https" || server.type == "http2") {
    http_1.createServer((req, res) => {
        let port = server.port == 443 ? "" : ":" + server.port;
        res.setHeader("Server", `NodeJS/${process.version}`);
        res.setHeader("X-Powered-By", `sfn/${init_1.version}`);
        res.setHeader("Location", "https://" + req.headers.host + port + req.url);
        res.statusCode = 301;
        res.statusMessage = http_1.STATUS_CODES[301];
        res.end(res.statusMessage);
    }).on("error", (err) => {
        if (err.message.match(/EADDRINUSE/)) {
            console.log(functions_inner_1.red `Failed to redirect HTTP: ${err.message}`);
        }
    }).listen(80);
}
//# sourceMappingURL=https-redirector.js.map