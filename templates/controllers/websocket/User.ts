import { WebSocketController, WebSocket, SocketError, event } from "sfn";
import { User } from "modelar";

export default class extends WebSocketController {
    /**
     * @example
     *  socket.emit("/user/create", {
     *      name: "luna",
     *      password: 12345",
     *      email: "luna@localhost"
     *  });
     */
    @event("/user/create")
    create(data, socket: WebSocket) {
        return User.use(socket.db).insert(data);
    }

    /**
     * @example
     *  socket.emit("/user/get", {id: 1})
     */
    @event("/user/get")
    async get(data: { id: number }, socket: WebSocket) {
        if (!data.id) {
            throw new SocketError(400);
        }
        try {
            return <User>await User.use(socket.db).get(data.id);
        } catch (e) {
            throw new SocketError(404, e.message);
        }
    }

    /**
     * @example
     *  socket.emit("/user/update", {
     *      id: 1,
     *      name: "tester"
     *      password: 12345",
     *      email: "tester@localhost"
     *  });
     */
    @event("/user/update")
    update(data: { id: number, [prop: string]: any }, socket: WebSocket) {
        return this.get(data, socket).then(user => {
            return user.update(data);
        });
    }

    /** 
     * @example
     *  socket.emit("/user/delete", {id: 1})
     */
    @event("/user/delate")
    delete(data: { id: number }, socket: WebSocket) {
        return this.get(data, socket).then(user => {
            return user.delete();
        });
    }

    /**
     * @example
     *  socket.emit("/user/login", {
     *      username: "tester"
     *      password: 12345",
     *  });
     */
    @event("/user/login")
    login(data: { username: string, password: string }, socket: WebSocket) {
        let options = {
            user: data.username,
            password: data.password
        };
        return (<User>User.use(socket.db)).login(options).then(user => {
            socket.session.uid = user.id;
            return user;
        });
    }

    @event("/user/logout")
    logout(socket: WebSocket) {
        delete socket.session.uid;
        return socket.user;
    }
}