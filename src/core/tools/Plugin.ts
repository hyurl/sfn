import * as alar from "alar";
import { applyMagic } from "js-magic";
import { APP_PATH } from '../../init';
import { resolveModulePath } from './functions-inner';

@applyMagic
export class Plugin<I = any, O = any> extends alar.ModuleProxy {
    protected paths: string[] = [];
    protected children: { [name: string]: Plugin } = {};

    constructor(readonly name: string) {
        super(name, APP_PATH + "/plugins");
    }

    bind(handler: (input?: I, output?: O) => Promise<void | O>) {
        let path = resolveModulePath(this.path);
        let name = this.resolve(path);

        if (!Plugin.Container[name]) {
            Plugin.Container[name] = {};
        }

        if (!Plugin.Container[name][this.name]) {
            Plugin.Container[name][this.name] = [];
        }

        Plugin.Container[name][this.name].push(handler);
        this.paths.includes(name) || this.paths.push(name);

        return this;
    }

    async call(input?: I, output?: O): Promise<O> {
        let result: O;

        for (let handler of this.getHandlers()) {
            result = await handler(input, output);
        }

        return result === undefined ? output : result;
    }

    getHandlers() {
        let handlers: Function[] = [];

        for (let name of this.paths) {
            let container = Plugin.Container[name];
            handlers = handlers.concat(container ? container[this.name] : []);
        }

        return handlers;
    }

    protected removeHandlers(name: string): boolean {
        return (delete Plugin.Container[name]);
    }

    /** DON'T call, plugin doesn't support remote service. */
    serve(): never {
        throw new ReferenceError("Plugin doesn't support remote service");
    }

    /** DON'T call, plugin doesn't support remote service. */
    connect(): never {
        return this.serve();
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

export namespace Plugin {
    export const Container: {
        [path: string]: {
            [name: string]: Function[];
        }
    } = {};
}