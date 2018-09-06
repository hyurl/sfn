import { createServer, STATUS_CODES } from "http";
import { config } from "../../bootstrap/ConfigLoader";
import { red } from "../../tools/functions-inner";
import { version } from "../../../init";

let server = config.server.http;

if (server.type == "https" || server.type == "http2") {
    // redirect all HTTP request to HTTPS.
    createServer((req, res) => {
        let port = server.port == 443 ? "" : ":" + server.port;
        res.setHeader("Server", `NodeJS/${process.version}`);
        res.setHeader("X-Powered-By", `sfn/${version}`);
        res.setHeader("Location", "https://" + req.headers.host + port + req.url);
        res.statusCode = 301;
        res.statusMessage = STATUS_CODES[301];
        res.end(res.statusMessage);
    }).on("error", (err) => {
        if (err.message.match(/EADDRINUSE/)) {
            console.log(red`Failed to redirect HTTP: ${err.message}`);
        }
    }).listen(80);
}