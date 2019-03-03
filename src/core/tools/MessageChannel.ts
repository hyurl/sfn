import { RpcClient } from 'alar';

export class MessageChannel {
    private events: { [name: string]: Function[] } = {};

    constructor(readonly name: string) { }

    /**
     * Publishes `data` to the given `event` in the channel, if `servers` are
     * provided, the event will only be emitted to them.
     */
    publish(event: string, data?: any, servers?: string[]) {
        let listeners: Function[];

        event = this.name + "#" + event;

        if (app.rpc.server) {
            // If the current server is an RPC server, publish the event via the
            // RPC channel.
            return app.rpc.server.publish(event, data, servers);
        } else if (listeners = this.events[event]) {
            (async () => {
                // Use JSON to re-construct the data for local call.
                data = JSON.parse(JSON.stringify(data));

                for (let handle of listeners) {
                    await handle(data);
                }
            })();

            return listeners.length > 0;
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
        // client as well.
        for (let client of app.rpc.clients) {
            client.subscribe(event, <any>listener);
        }

        return this;
    }

    /** Unsubscribes a `listener` or all listeners of the `event`. */
    unsubscribe(event: string, listener?: Function) {
        event = this.name + "#" + event;

        if (listener) {
            let listeners = this.events[event] || [];

            listeners.splice(listeners.indexOf(listener), 1);

            for (let client of app.rpc.clients) {
                client.unsubscribe(event, <any>listener);
            }
        } else {
            delete this.events[event];

            for (let client of app.rpc.clients) {
                client.unsubscribe(event);
            }
        }
    }

    /** @inner */
    linkRpcChannel(client: RpcClient) {
        for (let event in this.events) {
            for (let listener of this.events[event]) {
                client.subscribe(event, <any>listener);
            }
        }
    }
}

export class WebSocketMessage {
    readonly name = "app.message.ws";

    constructor(private data: any = {}) { }

    get volatile() {
        return new WebSocketMessage({ ...this.data, volatile: true });
    }

    get local() {
        return new WebSocketMessage({ ...this.data, local: true });
    }

    via(serverId: string) {
        return new WebSocketMessage({ ...this.data, serverId });
    }

    of(nsp: string) {
        return new WebSocketMessage({ ... this.data, nsp });
    }

    to(room: string) {
        return new WebSocketMessage({ ...this.data, room });
    }

    binary(hasBinary?: boolean) {
        return new WebSocketMessage({ ... this.data, binary: hasBinary });
    }

    emit(event: string, ...data: any[]) {
        let serverId: string;

        if (this.data.serverId) {
            serverId = this.data.serverId;
            delete this.data.serverId;
        } else {
            // If serverId isn't provided, use the default web server.
            serverId = "web-server-1";
        }

        return app.message.publish(this.name, {
            ...this.data,
            event,
            data
        }, [serverId]);
    }
}