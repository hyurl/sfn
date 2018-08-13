import { Server } from "socket.io";
import { WebSocket } from "../tools/interfaces";
import { session, getHash } from "../bootstrap/session";

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

        let hash = getHash(socket.session);

        // save session to store when the socket is closed.
        socket.on("disconnected", () => {
            if (hash !== getHash(socket.session))
                socket.session.save(() => { });
        });

        next();
    });
}