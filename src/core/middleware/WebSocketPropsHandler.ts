import { IncomingMessage } from "http";
import * as url from "url";
import endsWith = require("lodash/endsWith");
import { parseValue as parseAccepts } from "parse-accepts";
import { Server } from "socket.io";
import { config } from "../../index";
import { WebSocket } from "../tools/interfaces";

export function handleWebSocketProps(io: Server): void {
    io.use((socket: WebSocket, next) => {
        var req: IncomingMessage = socket.request;
        socket.protocol = socket.handshake.secure ? "wss" : "ws";
        socket.ip = socket.handshake.address;
        socket.host = req.headers.host;
        socket.secure = socket.handshake.secure;

        let forIp = <string>req.headers["x-forwarded-for"],
            proxy = {
                protocol: <string>req.headers["x-forwarded-proto"] || null,
                host: <string>req.headers["x-forwarded-host"] || null,
                ips: forIp && forIp.split(/\s*,\s*/) || [],
                ip: ""
            };
        proxy.ip = proxy.ips[0];

        socket.proxy = proxy;
        socket.host = req.headers.host;
        socket.ips = proxy.ips;
        socket.langs = parseAccepts(<string>req.headers["accept-language"]);
        socket.lang = socket.langs[0];

        let urlObj = url.parse(socket.protocol + "://" + socket.host);
        socket.hostname = urlObj.hostname;
        socket.port = urlObj.port && parseInt(urlObj.port);

        let hostname = config.server.hostname || config.server.host;
        let domains = <string[]>(Array.isArray(hostname) ? hostname : [hostname]);

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
    });
}