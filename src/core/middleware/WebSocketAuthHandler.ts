import { User } from "modelar";
import { Server } from "socket.io";
import { WebSocket } from "../tools/interfaces";
import { User as UserClass } from "../bootstrap/UserLoader";

export function handleWebSocketAuth(io: Server): void {
    io.use((socket: WebSocket, next) => {
        socket.user = null;
        if (socket.session && socket.session.uid) {
            UserClass.use(socket.db)
                .get(socket.session.uid)
                .then((user: User) => {
                    socket.user = user;
                    next();
                }).catch(() => {
                    next();
                });
        } else {
            next();
        }
    });
}