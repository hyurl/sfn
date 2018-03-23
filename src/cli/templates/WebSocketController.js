const { WebSocketController } = require("sfn");

exports.default = class extends WebSocketController {
    /** @event /{name}/create */
    create(data) {
        let { socket } = this;
        // ...
    }

    /** @event /{name}/get */
    get(data) {
        let { socket } = this;
        // ...
    }

    /** @event /{name}/update */
    update(data) {
        let { socket } = this;
        // ...
    }

    /** @event /{name}/delete */
    delete(data) {
        let { socket } = this;
        // ...
    }
}