import { DB, User } from "modelar";
import { Controller } from "./Controller";
import { WebSocket, Session } from "../tools/interfaces";
import { config } from "../bootstrap/load-config";
import { activeEvent } from "../tools/symbols";

/**
 * WebSocketController manages messages come from a socket.io client.
 * 
 * When you define a method in a WebSocketController and bind it to a certain 
 * socket.io event, it will be called automatically when the event fires. All 
 * methods in a WebSocketController accept at least one parameter: 
 * 
 * - `...data: any[]` sent by the client.
 * 
 * The corresponding `socket: WebSocket` object can be auto-injected into the 
 * controller as well, and its position is arbitrary. Or you can call it from 
 * `this`:
 * 
 * `let { socket } = this;`
 * 
 * You may `return` some data inside a method that bound to an event, when the
 * method is called, they will be automatically sent to the client. Actions 
 * will be handled in a Promise constructor, so you can do what ever you want 
 * inside the method. Using `async` methods to do asynchronous operations is 
 * recommended.
 * 
 * If you want to send a response manually, you can just call the 
 * `socket.emit()` to do so, the WebSocket support continuous message 
 * transmissions.
 */
export class WebSocketController extends Controller {
    /** Sets a specified namesapce for WebSocket channel (used by SocketIO). */
    static nsp: string = "/";

    /** Reference to the corresponding socket context. */
    readonly socket: WebSocket;

    constructor(socket: WebSocket) {
        super();
        this.authorized = socket.user !== null;
        this.socket = socket;
        this.lang = (socket.cookies && socket.cookies.lang)
            || socket.lang
            || config.lang;
    }

    /** Gets/Sets the DB instance. */
    get db(): DB {
        return this.socket.db;
    }

    set db(v: DB) {
        this.socket.db = v;
    }

    /** Alias of `socket.session`. */
    get session(): Session {
        return this.socket.session;
    }

    /** Alias of `socket.user` */
    get user(): User {
        return this.socket.user;
    }

    set user(v: User) {
        this.socket.user = v;
    }

    /**
     * The active event (namesapce included) when the controller is instantiated.
     */
    get event(): string {
        return this[activeEvent]
            || (this[activeEvent] = this.socket[activeEvent]);
    }
}