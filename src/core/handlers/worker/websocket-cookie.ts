import cookieParser = require("cookie-parser");
import { config } from "../../bootstrap/ConfigLoader";
import { ws, wss } from "../../bootstrap/index";
import { WebSocket } from "../../tools/interfaces";

ws ? ws.use(handler).use(handler2) : null;
wss ? wss.use(handler).use(handler2) : null;

const parser = cookieParser(config.session.secret);

function handler(socket: WebSocket, next: (err?: Error) => void) {
    parser(socket.handshake, {}, next);
}

function handler2(socket: WebSocket, next: (err?: Error) => void) {
    socket.cookies = socket.handshake["cookies"];
    next();
}