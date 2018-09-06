const { WebSocketController } = require("sfn");

exports.default = class extends WebSocketController {

    /**
     * @event /index
     * @example socket.emit('/index')
     */
    index() {
        return `Hello, I'm your socket pal, you can "chat" with me via the `
            + `socket.io client.\n Try typing `
            + `"socket.emit('/repeat-what-I-said', 'Hello, World!')" in you `
            + `browser console and see what's going to happen.`;
    }

    /**
     * @event /repeat-what-I-said
     * @example socket.emit('/repeat-what-I-said', 'Hello, World!')
     */
    repeatWhatISaid(data) {
        return data;
    }
}