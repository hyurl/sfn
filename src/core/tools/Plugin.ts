import { applyMagic } from "js-magic";

export const name = Symbol.for("name");

export abstract class PluginHost {
    get name() {
        return this[name];
    }

    abstract init(): void;
}

export namespace PluginHost {
    export const Container = new Map<string, Function[]>();
}

@applyMagic
export class Plugin<I = any, O = any> {
    protected hosts: PluginHost[] = [];
    protected children: { [name: string]: Plugin } = {};

    constructor(readonly name: string) { }

    bind(host: PluginHost, handler: (input: I, output: O) => Promise<void | O>) {
        let handlers = PluginHost.Container.get(host.name) || [];

        PluginHost.Container.set(host.name, handlers.concat([handler]));
        this.hosts.push(host.name);

        return this;
    }

    async call(caller: any, input: I, output: O): Promise<O> {
        let result: O;

        for (let host of this.hosts) {
            let handlers = PluginHost.Container.get(host.name);

            if (handlers) {
                for (let handler of handlers) {
                    result = await handler.call(caller, input, output);
                }
            }
        }

        return result || output;
    }

    protected __get(prop: string) {
        if (prop in this) {
            return this[prop];
        } else if (prop in this.children) {
            return this.children[prop];
        } else if (typeof prop != "symbol") {
            return this.children[prop] = new Plugin(
                this.name + "." + String(prop),
            );
        }
    }

    protected __has(prop: string) {
        return (prop in this) || (prop in this.children);
    }
}