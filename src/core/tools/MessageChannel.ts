import { RpcClient } from 'alar';
import values = require("lodash/values")

export class MessageChannel {
    private events: { [name: string]: Function[] } = {};

    constructor(readonly name: string) { }

    /**
     * Publishes `data` to the given `event` in the channel, if `servers` are
     * provided, the event will only be emitted to them.
     */
    publish(event: string, data?: any, servers?: string[]): boolean {
        event = this.name + "#" + event;

        if (app.rpc.server) {
            // If the current server is an RPC server, publish the event via the
            // RPC channel.
            return app.rpc.server.publish(event, data, servers);
        } else if (this.events[event] && this.events[event].length > 0) {
            // Invoke the listeners asynchronously.
            (async () => {
                for (let listener of this.events[event]) {
                    listener.call(void 0, data);
                }
            })().catch(() => null);

            return true;
        } else {
            return false;
        }
    }

    /** Subscribes a `listener` to the given `event` of the channel. */
    subscribe(event: string, listener: Function) {
        event = this.name + "#" + event;

        if (!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push(listener);

        // If there are active RPC connections, subscribe the event to the RPC
        // channel as well.
        for (let connection of values(app.rpc.connections)) {
            connection.subscribe(event, <any>listener);
        }

        return this;
    }

    /** Unsubscribes a `listener` or all listeners of the `event`. */
    unsubscribe(event: string, listener?: Function) {
        event = this.name + "#" + event;

        let listeners = this.events[event] || [];

        // Unsubscribe event listeners in the RPC channel.
        for (let connection of values(app.rpc.connections)) {
            connection.unsubscribe(event, <any>listener);
        }


        // Remove event listeners in the message channel.
        if (!listeners.length) {
            return false;
        } else if (listener) {
            let i = listeners.indexOf(listener);
            return i === -1 ? false : listeners.splice(i, 1).length > 0;
        } else {
            return delete this.events[event];
        }
    }

    /** @inner */
    linkRpcChannel(connection: RpcClient) {
        for (let event in this.events) {
            for (let listener of this.events[event]) {
                connection.subscribe(event, <any>listener);
            }
        }
    }
}

export abstract class Message {
    readonly abstract name: string;

    constructor(protected data: any = {}) { }

    /** Sends the message via a front end server. */
    via(appId: string): InstanceType<new (...args: any[]) => this> {
        return new (<any>this.constructor)({ ...this.data, appId });
    }

    /** Sends the message to a specified target. */
    to(target: string): InstanceType<new (...args: any[]) => this> {
        return new (<any>this.constructor)({ ...this.data, target });
    }

    protected getAppId() {
        let appId: string;

        if (this.data.appId) {
            appId = this.data.appId;
            delete this.data.appId;
        } else if (app.rpc.server) {
            // If appId isn't provided, use the default web server.
            appId = "web-server-1";
        } else {
            appId = app.id;
        }

        return appId;
    }
}

export class WebSocketMessage extends Message {
    readonly name = "app.message.ws";

    get volatile() {
        return new WebSocketMessage({ ...this.data, volatile: true });
    }

    get local() {
        return new WebSocketMessage({ ...this.data, local: true });
    }

    of(nsp: string) {
        return new WebSocketMessage({ ... this.data, nsp });
    }

    binary(hasBinary?: boolean) {
        return new WebSocketMessage({ ... this.data, binary: hasBinary });
    }

    emit(event: string, ...data: any[]) {
        return app.message.publish(this.name, {
            ...this.data,
            event,
            data
        }, [this.getAppId()]);
    }
}

export class SSEMessage extends Message {
    readonly name = "app.message.sse";

    close() {
        return app.message.publish(this.name, {
            ...this.data,
            close: true
        }, [this.getAppId()]);
    }

    send(data: any) {
        return app.message.publish(this.name, {
            ...this.data,
            data,
        }, [this.getAppId()]);
    }

    emit(event: string, data?: any) {
        return app.message.publish(this.name, {
            ...this.data,
            event,
            data,
        }, [this.getAppId()]);
    }
}