import { MessageChannel, WebSocketMessage } from "../tools/MessageChannel";

declare global {
    namespace app {
        namespace message {
            const name: string;
            const events: { [name: string]: Function[] };
            const ws: WebSocketMessage;

            function publish(event: string, data: any): boolean;
            function subscribe(event: string, listener: (data: any) => void | Promise<void>): MessageChannel;
        }
    }
}

global["app"].message = new MessageChannel("app.message");
global["app"].message.ws = new WebSocketMessage;