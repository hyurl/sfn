import { WebSocketController, event } from "sfn";

export default class extends WebSocketController {

    /**
     * @example
     *  socket.emit('/index')
     */
    @event("/index")
    index() {
        return `Hello, I'm your socket pal, you can "chat" with me via the `
            + `socket.io client.\n Try typing `
            + `"socket.emit('/repeat-what-I-said', 'Hello, World!')" in you `
            + `browser console and see what's going to happen.`;
    }

    /**
     * @example
     *  socket.emit('/repeat-what-I-said', 'Hello, World!')
     */
    @event("/repeat-what-I-said")
    repeatWhatISaid(data: string) {
        return data;
    }
}