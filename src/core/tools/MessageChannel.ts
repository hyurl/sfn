import values = require("lodash/values");

export class MessageChannel {
    private topics = new Map<string, Set<(data: any) => void>>();

    constructor(readonly name: string) { }

    /**
     * Publishes `data` to the given `topic` in the channel, if `servers` are
     * provided, the topic will only be emitted to them.
     */
    publish(topic: string, data?: any, servers?: string[]): boolean {
        topic = this.name + "#" + topic;
        let listeners: Set<(data: any) => void>;

        if (app.rpc.server) {
            // If the current server is an RPC server, publish the topic via the
            // RPC channel.
            return app.rpc.server.publish(topic, data, servers);
        } else if ((listeners = this.topics.get(topic)) && listeners.size > 0) {
            listeners.forEach(handle => {
                try { handle(data); } catch (e) { }
            });

            return true;
        } else {
            return false;
        }
    }

    /** Subscribes a `listener` to the given `topic` of the channel. */
    subscribe(topic: string, listener: (data: any) => void) {
        topic = this.name + "#" + topic;
        let listeners = this.topics.get(topic);

        listeners || this.topics.set(topic, listeners = new Set());
        listeners.add(listener);

        // If there are active RPC connections, subscribe the topic to the RPC
        // channel as well.
        for (let connection of values(app.rpc.connections)) {
            connection.subscribe(topic, <any>listener);
        }

        return this;
    }

    /** Unsubscribes a `listener` or all listeners of the `topic`. */
    unsubscribe(topic: string, listener?: (data: any) => void) {
        topic = this.name + "#" + topic;
        let listeners = this.topics.get(topic);

        // Unsubscribe topic listeners in the RPC channel.
        for (let connection of values(app.rpc.connections)) {
            connection.unsubscribe(topic, <any>listener);
        }

        // Remove topic listeners in the message channel.
        if (!listeners || listeners.size === 0) {
            return false;
        } else if (listener) {
            return listeners.delete(listener);
        } else {
            return this.topics.delete(topic);
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

    protected getWebServers(): string[] {
        if (this.data.appId) {
            let appId = this.data.appId;
            delete this.data.appId;
            return [appId];
        } else if (app.isWebServer) {
            return [app.id];
        } else if (app.rpc.server) {
            let webServer: string[] = [];

            for (let id of app.rpc.server.getClients()) {
                if (id.startsWith("web-server")) {
                    webServer.push(id);
                    break;
                }
            }

            return webServer.length > 0 ? webServer : ["web-server"];
        }

        return [];
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
        }, this.getWebServers());
    }
}

export class SSEMessage extends Message {
    readonly name = "app.message.sse";

    close() {
        return app.message.publish(this.name, {
            ...this.data,
            close: true
        }, this.getWebServers());
    }

    send(data: any) {
        return app.message.publish(this.name, {
            ...this.data,
            data,
        }, this.getWebServers());
    }

    emit(event: string, data?: any) {
        return app.message.publish(this.name, {
            ...this.data,
            event,
            data,
        }, this.getWebServers());
    }
}
