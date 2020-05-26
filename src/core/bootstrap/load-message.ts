import { MessageChannel, WebSocketMessage, SSEMessage } from "../tools/MessageChannel";
import define from '@hyurl/utils/define';

declare global {
    namespace app {
        const message: MessageChannel & message;
        interface message {
            /** Sends message to the client through the WebSocket channel. */
            ws: WebSocketMessage,
            /** Sends message to the client through the SSE channel. */
            sse: SSEMessage
        }
    }
}

define(app, "message", new MessageChannel("app.message"));
app.message.ws = new WebSocketMessage;
app.message.sse = new SSEMessage;