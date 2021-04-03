import { Controller } from "./Controller";
import { WebSocket, Session } from "../tools/interfaces";

export const activeEvent = Symbol("activeEvent");

/**
 * WebSocketController manages messages come from a socket.io client.
 * 
 * When you define a method in a WebSocketController and bind it to a certain 
 * socket.io event, it will be called automatically when the event fires.
 */
export class WebSocketController extends Controller {
    /** Sets a specified namespace for WebSocket channel (used by SocketIO). */
    static nsp: string = "/";

    /** The current active event (namespace included). */
    readonly event: string;

    constructor(
        /** The current websocket context. */
        readonly socket: WebSocket
    ) {
        super();
        this.event = this.socket[activeEvent];
        this.lang = (socket.cookies && socket.cookies.lang)
            || socket.lang
            || app.config.lang;
    }

    /** Alias of `socket.session`. */
    get session(): Session {
        return this.socket.session;
    }
}
