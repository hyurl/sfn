const { WebSocketController } = require("sfn");
const { User } = require("modelar");

exports.default = class extends WebSocketController {
    /**
     * @event /user/create
     * @example
     *  socket.emit("/user/create", {
     *      name: "luna",
     *      password: 12345",
     *      email: "luna@localhost"
     *  });
     * @returns {Promise<User>}
     */
    create(data) {
        let { socket } = this;
        return User.use(socket.db).insert(data);
    }

    /**
     * @param {{ id: number }} data
     * @event /user/get
     * @example socket.emit("/user/get", {id: 1})
     * @returns {Promise<User>}
     */
    async get(data) {
        let { socket } = this;
        if (!data.id) {
            throw new SocketError(400);
        }
        try {
            return await User.use(socket.db).get(data.id);
        } catch (e) {
            throw new SocketError(404, e.message);
        }
    }

    /**
     * @event /user/update
     * @example
     *  socket.emit("/user/update", {
     *      id: 1,
     *      name: "tester"
     *      password: 12345",
     *      email: "tester@localhost"
     *  });
     */
    update(data) {
        return this.get(data).then(user => {
            return user.update(data);
        });
    }

    /**
     * @event /user/delate
     * @example socket.emit("/user/delete", {id: 1})
     */
    delete(data) {
        return this.get(data).then(user => {
            return user.delete();
        });
    }

    /**
     * @event /user/login
     * @example
     *  socket.emit("/user/login", {
     *      name: "tester"
     *      password: 12345",
     *  });
     */
    login(data) {
        let { socket } = this;
        let options = {
            user: data.username,
            password: data.password
        };
        return User.use(socket.db).login(options).then(user => {
            socket.session.uid = user.id;
            return user;
        });
    }

    /** @event /user/logout */
    logout() {
        delete this.session.uid;
        return this.socket.user;
    }
}