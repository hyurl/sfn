import cookieParser = require("cookie-parser");
import { config } from "../../bootstrap/ConfigLoader";
import { WebSocket } from "../../tools/interfaces";

const parser = cookieParser(config.session.secret);

export default async function (socket: WebSocket, next: (err?: Error) => void) {
    parser(socket.handshake, {}, next);
}

export async function handler2(socket: WebSocket, next: (err?: Error) => void) {
    socket.cookies = socket.handshake["cookies"];
    await next();
}