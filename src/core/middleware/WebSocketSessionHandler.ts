import { Server } from "socket.io";
import { WebSocket } from "../tools/interfaces";
import { session } from "./HttpSessionHandler";

export function handleWebSocketSession(io: Server): void {
    io.use((socket, next) => {
        // Parse session.
        session(socket.handshake, {}, next);
    }).use((socket: WebSocket, next) => {
        // Handle session in socket.
        socket.session = new Proxy(socket.handshake["session"], {
            set: (session, key, value) => {
                session[key] = value;
                return true;
            },
            get: (session, key) => session[key],
            has: (session, key) => key in session,
            deleteProperty: (session, key) => delete session[key]
        });

        // save session to store when the socket is closed.
        socket.on("disconnected", () => {
            socket.session.save(() => { });
        });

        next();
    });
}