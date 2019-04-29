import { MessageChannel, WebSocketMessage, SSEMessage } from "../tools/MessageChannel";

declare global {
    namespace app {
        const message: MessageChannel & {
            /** Sends message to the client through the WebSocket channel. */
            ws: WebSocketMessage,
            /** Sends message to the client through the SSE channel. */
            sse: SSEMessage
        };
    }
}

global["app"].message = new MessageChannel("app.message");
global["app"].message.ws = new WebSocketMessage;
global["app"].message.sse = new SSEMessage;