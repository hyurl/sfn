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

    get exports() {
        return {};
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

    /** DON'T call, plugin doesn't support remote service. */
    serve(): never {
        throw new ReferenceError("Plugin doesn't support remote service");
    }

    /** DON'T call, plugin doesn't support remote service. */
    connect(): never {
        return this.serve();
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
}

export namespace Plugin {
    export const Container: {
        [path: string]: {
            [name: string]: Function[];
        }
    } = {};
}