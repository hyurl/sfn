import { WebSocket } from "../tools/interfaces";
import { session } from "./http-session";

export default function (socket: WebSocket, next: (err?: Error) => void) {
    if (!app.config.session)
        return next();

    // Parse session.
    session?.(socket.handshake, {}, next);
}

export function handler2(socket: WebSocket, next: (err?: Error) => void) {
    if (!app.config.session)
        return next();

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
