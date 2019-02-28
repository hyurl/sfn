import { MessageChannel, WebSocketMessage } from "../tools/MessageChannel";

declare global {
    namespace app {
        const message: MessageChannel & { ws: WebSocketMessage };
    }
}

global["app"].message = new MessageChannel("app.message");
global["app"].message.ws = new WebSocketMessage;