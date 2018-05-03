"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const endsWith = require("lodash/endsWith");
const parse_accepts_1 = require("parse-accepts");
const init_1 = require("../../init");
function handleWebSocketProps(io) {
    io.use((socket, next) => {
        var req = socket.request;
        socket.protocol = socket.handshake.secure ? "wss" : "ws";
        socket.ip = socket.handshake.address;
        socket.host = req.headers.host;
        socket.secure = socket.handshake.secure;
        let forIp = req.headers["x-forwarded-for"], proxy = {
            protocol: req.headers["x-forwarded-proto"] || null,
            host: req.headers["x-forwarded-host"] || null,
            ips: forIp && forIp.split(/\s*,\s*/) || [],
            ip: ""
        };
        proxy.ip = proxy.ips[0];
        socket.proxy = proxy;
        socket.host = req.headers.host;
        socket.ips = proxy.ips;
        socket.langs = parse_accepts_1.parseValue(req.headers["accept-language"]);
        socket.lang = socket.langs[0];
        let urlObj = url.parse(socket.protocol + "://" + socket.host);
        socket.hostname = urlObj.hostname;
        socket.port = urlObj.port && parseInt(urlObj.port);
        let domains = !Array.isArray(init_1.config.server.host)
            ? [init_1.config.server.host]
            : init_1.config.server.host;
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
exports.handleWebSocketProps = handleWebSocketProps;
//# sourceMappingURL=WebSocketPropsHandler.js.map