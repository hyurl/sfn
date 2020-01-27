import { WebSocketController, event, queue, requireAuth } from "sfn";
import sleep from "@hyurl/utils/sleep";

export default class iWebSocketController extends WebSocketController {
    authorized = true;

    /**
     * @example
     *  socket.emit('greeting')
     */
    @event("greeting")
    index() {
        return `Hello, I'm your socket pal, you can "chat" with me via the `
            + `socket.io client.\n Try typing `
            + `"socket.emit('repeat-what-I-said', 'Hello, World!')" in you `
            + `browser console and see what's going to happen.`;
    }

    /**
     * @example
     *  socket.emit('repeat-what-I-said', 'Hello, World!')
     */
    @event("repeat-what-I-said")
    @queue("repeat-what-I-said")
    @requireAuth
    async repeatWhatISaid(data: string) {
        await sleep(1000);
        return data;
    }

    @event("iterator-test")
    async *test() {
        for await (let result of app.services.test().asyncIterator()) {
            yield result;
        }
    }
}