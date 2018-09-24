import { IncomingMessage } from "http";
import * as url from "url";
import endsWith = require("lodash/endsWith");
import { parseValue as parseAccepts } from "parse-accepts";
import { config } from "../../bootstrap/ConfigLoader";
import { ws } from "../../bootstrap/index";
import { WebSocket } from "../../tools/interfaces";

ws ? ws.use(handler) : null;

function handler(socket: WebSocket, next: (err?: Error) => void) {
    try {
        let req: IncomingMessage = socket.request;

        socket.protocol = socket.handshake.secure ? "wss" : "ws";
        socket.ip = socket.handshake.address;
        socket.host = req.headers.host;
        socket.secure = socket.handshake.secure;

        if (req.headers["x-forwarded-for"] || req.headers["x-forwarded-proto"]
            || req.headers["x-forwarded-host"]) {
            let forIp = <string>req.headers["x-forwarded-for"],
                proxy = {
                    protocol: <string>req.headers["x-forwarded-proto"] || null,
                    host: <string>req.headers["x-forwarded-host"] || null,
                    ips: forIp && forIp.split(/\s*,\s*/) || [],
                    ip: ""
                };
            proxy.ip = proxy.ips[0];
            socket.proxy = proxy;
        } else {
            socket.proxy = null;
        }

        socket.host = req.headers.host;
        socket.ips = socket.proxy ? socket.proxy.ips : [socket.ip];
        socket.langs = parseAccepts(<string>req.headers["accept-language"]);
        socket.lang = socket.langs[0];

        let urlObj = url.parse(socket.protocol + "://" + socket.host);
        socket.hostname = urlObj.hostname;
        socket.port = urlObj.port && parseInt(urlObj.port);

        let hostname = config.server.hostname;
        let domains: string[] = Array.isArray(hostname) ? hostname : [hostname];

        for (let domain of domains) {
            if (socket.hostname.length > domain.length
                && endsWith(socket.hostname, domain)) {
                let i = socket.hostname.length - domain.length - 1;
                socket.domainName = domain;
                socket.subdomain = urlObj.hostname.substring(0, i);
                break;
            }
        }
        next();
    } catch (err) {
        next(err);
    }
}