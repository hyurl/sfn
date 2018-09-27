import { WebSocket } from "../../tools/interfaces";
import { User } from "../../bootstrap/UserLoader";

export default async function (socket: WebSocket, next: (err?: Error) => void) {
    socket.user = null;
    if (socket.session && socket.session.uid) {
        try {
            socket.user = <any>await User.use(socket.db).get(socket.session.uid);
        } catch (e) { }
    }
    await next();
}