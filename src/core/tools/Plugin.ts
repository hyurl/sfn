import * as alar from "alar";
import { APP_PATH } from '../../init';
import { resolveModulePath, createImport } from './functions-inner';

const tryImport = createImport(require);

export class Plugin<I = any, O = any> extends alar.ModuleProxy {
    protected paths: string[] = [];
    protected children: { [name: string]: Plugin } = {};

    constructor(readonly name: string) {
        super(name, APP_PATH + "/plugins");
    }

    bind(handler: (input?: I, output?: O) => void | O | Promise<void | O>) {
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

    async invoke(input?: I, output?: O): Promise<O> {
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

    watch() {
        return super.watch().on("add", (filename: string) => {
            this.resolve(filename) && tryImport(filename);
        }).on("change", (filename: string) => {
            let name = this.resolve(filename);

            if (name) {
                // remove previous plugins from the internal container
                delete Plugin.Container[name];
                tryImport(filename);
            }
        }).on("unlink", (filename: string) => {
            let name = this.resolve(filename);
            name && (delete Plugin.Container[name]);
        });
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
}

export namespace Plugin {
    export const Container: {
        [path: string]: {
            [name: string]: Function[];
        }
    } = {};
}