import { WebSocket } from "../tools/interfaces";
import { importUser } from "../tools/functions-inner";

export default async function (socket: WebSocket, next: (err?: Error) => void) {
    socket.user = null;
    if (socket.session && socket.session.uid) {
        try {
            socket.user = <any>await importUser().use(socket.db).get(socket.session.uid);
        } catch (e) { }
    }
    await next();
}