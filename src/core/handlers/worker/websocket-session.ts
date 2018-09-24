import { ws } from "../../bootstrap/index";
import { WebSocket } from "../../tools/interfaces";
import { session } from "./http-session";

ws ? ws.use(handler).use(handler2) : null;

function handler(socket: WebSocket, next: (err?: Error) => void) {
    // Parse session.
    session(socket.handshake, {}, next);
}

function handler2(socket: WebSocket, next: (err?: Error) => void) {
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
}