import { Service } from "../tools/Service";
import { Session } from "../tools/interfaces";

export interface ControllerConstructor<T = any> {
    new(...args: any[]): T;
    filename: string
};

/**
 * The Controller give you a common API to return data to the underlying 
 * response context, all controllers will be automatically handled by the 
 * framework.
 */
export abstract class Controller extends Service {
    /** Indicates whether the operation is authorized. */
    authorized: boolean = false;

    abstract readonly session: Session;
    static flow: Service = null;

    /** A reference to the class constructor. */
    get ctor(): new (...args: any[]) => this {
        return <any>this.constructor;
    };

    /** @deprecated Use `init()` instead. */
    before?(): void | Promise<void>;

    /** @deprecated Use `destroy()` instead. */
    after?(): void | Promise<void>;

    async throttle<T>(key: string, body: () => T | Promise<T>, interval = 0) {
        key = this.session.id + ":" + key;
        return Controller.flow.throttle(key, body, interval);
    }

    async queue<T>(key: string, body: () => T | Promise<T>) {
        key = this.session.id + ":" + key;
        return Controller.flow.queue(key, body);
    }
}