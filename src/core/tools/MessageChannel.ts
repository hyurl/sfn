export class MessageChannel {
    readonly events: { [name: string]: Function[] } = {};

    constructor(readonly name: string) { }

    publish(event: string, data: any) {
        let listeners: Function[];

        event = this.name + "#" + event;

        if (app.rpc.server) {
            // If the current server is an RPC server, publish the event via the
            // RPC channel.
            return app.rpc.server.publish(event, data);
        } else if (listeners = this.events[event]) {
            // If the current server is not a RPC server, say the Web server, 
            // just trigger all the event listeners.
            (async () => {
                for (let handle of listeners) {
                    await handle(data);
                }
            })();

            return listeners.length > 0;
        }
    }

    subscribe(event: string, listener: (data: any) => void | Promise<void>) {
        event = this.name + "#" + event;

        if (!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push(listener);

        // If there are active RPC connections, subscribe the event to the RPC
        // client as well.
        if (app.rpc.clients.length) {
            for (let client of app.rpc.clients) {
                client.subscribe(event, listener);
            }
        }

        return this;
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