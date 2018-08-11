import { DB, User } from "modelar";
import { Controller } from "./Controller";
import { WebSocket, Session } from "../tools/interfaces";
import { config } from "../../index";

export type WebSocketNextHandler = (controller: WebSocketController) => void;

/**
 * WebSocketController manages messages come from a socket.io client.
 * 
 * When you define a method in a WebSocketController, it will be called 
 * automatically when a socket.io event fires. All methods in a 
 * WebSocketController accept two or more parameters in the following sequence: 
 * 
 * - `...data: any[]` sent by the client.
 * - `socket: WebSocket` the underlying socket.
 * 
 * If you're programing with pure JavaScript, I suggest you call `socket` from
 * the `this` object in the controller instead, it should give you proper IDE 
 * hints of this two objects.
 * 
 * The decorator function `@event()` is used to set socket events,but when 
 * you're using pure JavaScript, there is not decorators. but the framework 
 * support another compatible way to allow you doing such things by using the 
 * **jsdoc** block with an `@event` tag, but you need to set 
 * `config.enableDocRoute` to `true`.
 */
export class WebSocketController extends Controller {
    /** A reference to the class object. */
    Class: typeof WebSocketController = <any>this.constructor;

    /** Reference to the corresponding socket context. */
    readonly socket: WebSocket;
    /** Whether the controller is initiated asynchronously. */
    readonly isAsync: boolean;

    /**
     * Creates a new socket controller instance.
     * 
     * You can pass a third parameter `next` to the constructor, if it is is 
     * defined, then the constructor can handle asynchronous actions. And at 
     * where you want to call the real method, use `next(this)` to call it.
     */
    constructor(socket: WebSocket, next: WebSocketNextHandler = null) {
        super();
        this.authorized = socket.user !== null;
        this.socket = socket;
        this.isAsync = next instanceof Function;
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
}