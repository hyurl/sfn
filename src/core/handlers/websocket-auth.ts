import { WebSocket } from "../tools/interfaces";
import { loadUser } from "../bootstrap/load-user";

export default async function (socket: WebSocket, next: (err?: Error) => void) {
    socket.user = null;
    if (socket.session && socket.session.uid) {
        try {
            socket.user = <any>await loadUser().use(socket.db).get(socket.session.uid);
        } catch (e) { }
    }
    await next();
}