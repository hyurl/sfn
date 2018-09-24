import { ws } from "../../bootstrap/index";
import { WebSocket } from "../../tools/interfaces";
import { User } from "../../bootstrap/UserLoader";

ws ? ws.use(handler) : null;

function handler(socket: WebSocket, next: (err?: Error) => void) {
    socket.user = null;
    if (socket.session && socket.session.uid) {
        User.use(socket.db)
            .get(socket.session.uid)
            .then((user: any) => {
                socket.user = user;
                next();
            }).catch((err) => {
                next(err);
            });
    } else {
        next();
    }
}