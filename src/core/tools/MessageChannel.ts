import { RpcClient } from 'alar';

export class MessageChannel {
    private events: { [name: string]: Function[] } = {};
    private listenerMap = new Map<Function, Function>();

    constructor(readonly name: string) { }

    /** Publishes the optional `data` to the given `event` in the channel. */
    publish(event: string, data?: any) {
        let listeners: Function[];

        event = this.name + "#" + event;

        if (app.rpc.server) {
            // If the current server is an RPC server, publish the event via the
            // RPC channel.
            app.rpc.server.publish(event, [app.serverId, data]);
        }

        if (listeners = this.events[event]) {
            (async () => {
                for (let handle of listeners) {
                    await handle(data);
                }
            })();

            return listeners.length > 0;
        }

        return false;
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
            client.subscribe(event, this.createRpcListener(listener));
        }

        return this;
    }

    /** Unsubscribes a `listener` or all listeners of the `event`. */
    unsubscribe(event: string, listener?: Function) {
        event = this.name + "#" + event;

        if (listener) {
            let listeners = this.events[event] || [];
            let fn = this.listenerMap.get(listener);

            listeners.splice(listeners.indexOf(listener), 1);

            if (fn) {
                for (let client of app.rpc.clients) {
                    client.unsubscribe(event, <any>fn);
                }
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
                client.subscribe(event, this.createRpcListener(listener));
            }
        }
    }

    private createRpcListener(listener: Function) {
        let fn = async ([serverId, data]) => {
            if (serverId !== app.serverId) {
                await listener(data);
            }
        };
        this.listenerMap.set(listener, fn);
        return fn;
    }
}

export class WebSocketMessage {
    readonly name = "app.message.ws";

    constructor(private data: object = {}) { }

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
        return app.message.publish(this.name, {
            ...this.data,
            event,
            data
        });
    }
}