export class MessageChannel {
    readonly events: { [name: string]: Function[] } = {};

    constructor(readonly name: string) { }

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

    subscribe(event: string, listener: Function) {
        event = this.name + "#" + event;

        if (!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push(listener);

        // If there are active RPC connections, subscribe the event to the RPC
        // client as well.
        for (let client of app.rpc.clients) {
            client.subscribe(event, async ([serverId, data]) => {
                if (serverId !== app.serverId) {
                    await listener(data);
                }
            });
        }

        return this;
    }

    unsubscribe(event: string) {
        delete this.events[event];

        for (let client of app.rpc.clients) {
            client.unsubscribe(event);
        }
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