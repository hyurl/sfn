import { RpcClient } from 'alar';
import clusterChannel from "ipchannel";

export class MessageChannel {
    private events: { [name: string]: Function[] } = {};
    private clusterListenerMap = new Map<Function, Function>();

    constructor(readonly name: string) { }

    /**
     * Publishes `data` to the given `event` in the channel, if `servers` are
     * provided, the event will only be emitted to them.
     */
    publish(event: string, data?: any, servers?: string[]) {
        event = this.name + "#" + event;

        if (app.rpc.server) {
            // If the current server is an RPC server, publish the event via the
            // RPC channel.
            return app.rpc.server.publish(event, data, servers);
        } else if (!servers) {
            // Publish event to all cluster members.
            return clusterChannel.to("all").emit(event, data);
        } else {
            // Publish event to specified cluster members.
            let ok = false;

            for (let receiver of servers) {
                receiver = receiver.match(/\d+/)[0];
                ok = true;

                clusterChannel.to(parseInt(receiver)).emit(event, data);
            }

            return ok;
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
        for (let connection of app.rpc.connections) {
            connection.subscribe(event, <any>listener);
        }

        if (!app.rpc.server) {
            clusterChannel.on(event, this.bindClusterChannel(listener));
        }

        return this;
    }

    /** Unsubscribes a `listener` or all listeners of the `event`. */
    unsubscribe(event: string, listener?: Function) {
        event = this.name + "#" + event;

        let clusterListener: Function;
        let listeners = this.events[event] || [];

        // Unsubscribe event listeners in the RPC channel.
        for (let connection of app.rpc.connections) {
            connection.unsubscribe(event, <any>listener);
        }

        // Remove event listeners in the cluster channel.
        if (listener) {
            clusterChannel.removeAllListeners(event);
        } else if (clusterListener = this.clusterListenerMap.get(listener)) {
            clusterChannel.removeListener(event, <any>clusterListener);
        }


        // Remove event listeners in the message channel.
        if (!listeners.length) {
            return false;
        } else if (listener) {
            return listeners.splice(listeners.indexOf(listener), 1).length > 0;
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

    private bindClusterChannel(listener: Function) {
        let fn = (_: number, data: any) => listener(data);
        this.clusterListenerMap.set(listener, fn);
        return fn;
    }
}

export abstract class Message {
    readonly abstract name: string;

    constructor(protected data: any = {}) { }

    /** Sends the message via a front end server. */
    via(serverId: string) {
        return new (<any>this.constructor)({ ...this.data, serverId });
    }

    /** Sends the message to a specified target. */
    to(target: string) {
        return new (<any>this.constructor)({ ...this.data, target });
    }

    protected getServerId() {
        let serverId: string;

        if (this.data.serverId) {
            serverId = this.data.serverId;
            delete this.data.serverId;
        } else if (app.rpc.server) {
            // If serverId isn't provided, use the default web server.
            serverId = "web-server-1";
        } else {
            serverId = app.serverId;
        }

        return serverId;
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
        }, [this.getServerId()]);
    }
}

export class SSEMessage extends Message {
    readonly name = "app.message.sse";

    close() {
        app.message.publish(this.name, {
            ...this.data,
            close: true
        }, [this.getServerId()]);
    }

    send(data: any) {
        return app.message.publish(this.name, {
            ...this.data,
            data,
        }, [this.getServerId()]);
    }

    emit(event: string, data?: any) {
        return app.message.publish(this.name, {
            ...this.data,
            event,
            data,
        }, [this.getServerId()]);
    }
}