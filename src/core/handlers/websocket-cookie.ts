import cookieParser = require("cookie-parser");
import { WebSocket } from "../tools/interfaces";

const parse = cookieParser(app.config.session.secret);

export default async function (socket: WebSocket, next: (err?: Error) => void) {
    parse(<any>socket.handshake, <any>{}, next);
}

export async function handler2(socket: WebSocket, next: (err?: Error) => void) {
    socket.cookies = socket.handshake["cookies"];
    await next();
}