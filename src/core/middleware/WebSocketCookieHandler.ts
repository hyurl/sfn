import cookieParser = require("cookie-parser");
import { Server } from "socket.io";
import { config } from "../../index";
import { WebSocket } from "../tools/interfaces";

const parser = cookieParser(config.session.secret);

export function handleWebSocketCookie(io: Server): void {
    // socket.io middleware for handling cookies.
    io.use((socket: WebSocket, next) => {
        // Parse cookies.
        parser(socket.handshake, {}, next);
    }).use((socket: WebSocket, next) => {
        socket.cookies = socket.handshake["cookies"];
        next();
    });
}