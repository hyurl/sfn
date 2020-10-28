import { Service } from "../tools/Service";
import { Session } from "../tools/interfaces";

export interface ResultMessage<T = any> {
    success: boolean;
    code: number;
    data?: T;
    error?: string;
}

/**
 * The is the base class of `HttpController` and `WebSocketController`, it gives
 * you a common API to return data to the underlying response context, all
 * controllers will be automatically handled by the framework, you don't have to
 * create instance for them.
 */
export abstract class Controller extends Service {
    /** Indicates whether the operation is authorized. */
    authorized: boolean = false;

    /** The session of the current request/websocket context. */
    abstract readonly session: Session;

    /** @inner */
    static flow: Service = null;

    /** @inner A reference to the class constructor. */
    get ctor(): new (...args: any[]) => this {
        return <any>this.constructor;
    };

    /** @override */
    protected async gc() { }

    /** @override */
    async init(): Promise<void> { }

    /** @override */
    async throttle<T>(key: string, handle: () => T | Promise<T>, interval = 1000) {
        return Controller.flow.throttle(key, handle, interval);
    }

    /** @override */
    async queue<T>(key: string, handle: () => T | Promise<T>) {
        return Controller.flow.queue(key, handle);
    }

    /** Returns a result indicates the operation is succeeded. */
    success<T = any>(data: T, code: number = 200): ResultMessage<T> {
        return {
            success: true,
            code,
            data: data ?? null,
        };
    }

    /** Returns a result indicates the operation is failed. */
    fail(msg: string | Error, code: number = 500): ResultMessage<void> {
        msg = msg instanceof Error ? msg.message : msg;
        return {
            success: false,
            code,
            error: this.i18n(msg)
        };
    }

    /** @deprecated Use `fail` instead. */
    error(msg: string | Error, code: number = 500): ResultMessage<void> {
        return this.fail(msg, code);
    }
}
