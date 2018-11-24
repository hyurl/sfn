import { DB, User } from "modelar";
import { Controller } from "./Controller";
import { WebSocket, Session } from "../tools/interfaces";
import { config } from "../bootstrap/ConfigLoader";

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
 * 
 * The decorator function `@event()` is used to set socket events. But when 
 * you're coding in JavaScript, there is not decorators, the framework 
 * support another compatible way to allow you doing such things by using the 
 * **jsdoc** block with an `@event` tag, but you need to set 
 * `config.enableDocRoute` to `true`.
 */
export class WebSocketController extends Controller {
    /** Reference to the corresponding socket context. */
    readonly socket: WebSocket;

    static nsp: string = "/";

    constructor(socket: WebSocket) {
        super();
        this.authorized = socket.user !== null;
        this.socket = socket;
        this.lang = (socket.cookies && socket.cookies.lang)
            || socket.lang
            || config.lang;
    }

    get Class(): typeof WebSocketController {
        return <any>this.constructor;
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
}