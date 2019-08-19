import { normalize, extname } from 'path';
import { watch } from "chokidar";
import { applyMagic } from 'js-magic';
import { interceptAsync } from 'function-intercepter';
import { createImport, traceModulePath } from './internal/module';

const tryImport = createImport(require);

@applyMagic
export class Hook<I = void, O = void> {
    protected path: string;
    protected children: { [name: string]: Hook } = {};

    constructor(readonly name: string, path: string) {
        this.path = normalize(path);
    }

    /** Binds a handler to the hook. */
    bind(handler: (input?: I, output?: O) => void | O | Promise<void | O>) {
        let path = traceModulePath(this.path) || "<internal>";

        if (!Hook.Container[path]) {
            Hook.Container[path] = {};
        }

        if (!Hook.Container[path][this.name]) {
            Hook.Container[path][this.name] = [];
        }

        Hook.Container[path][this.name].push(handler);

        return this;
    }

    /** Invokes all handlers in the hook. */
    async invoke(input?: I, output?: O): Promise<O> {
        let result: O;

        for (let handler of this.getHandlers()) {
            let res = await handler(input, output);
            res === undefined || (result = res);
        }

        return result === undefined ? output : result;
    }

    /**
     * Uses the hook as a method decorator, when doing this, the arguments
     * passed to the handlers will be the same ones passed to the method, and 
     * any returning value form the handlers will be ignored.
     */
    decorate(): MethodDecorator {
        return interceptAsync().before(async (...args) => {
            for (let handler of this.getHandlers()) {
                await handler(...args);
            }
        });
    }

    getHandlers() {
        let handlers: Function[] = [];

        for (let container of Object.values(Hook.Container)) {
            let _handlers = container[this.name];

            if (_handlers && _handlers.length > 0) {
                handlers.push(..._handlers);
            }
        }

        return handlers;
    }

    protected __get(prop: string) {
        if (prop in this) {
            return this[prop];
        } else if (prop in this.children) {
            return this.children[prop];
        } else if (typeof prop != "symbol") {
            return this.children[prop] = new Hook(
                this.name + "." + String(prop),
                this.path
            );
        }
    }

    protected __has(prop: string) {
        return (prop in this) || (prop in this.children);
    }
}

export namespace Hook {
    export const Container: {
        [path: string]: {
            [name: string]: Function[];
        }
    } = {};
}

export class HookProxy extends Hook {
    watch() {
        return watch(this.path, {
            followSymlinks: false,
            awaitWriteFinish: true,
            ignored: /\.(js\.map|d\.ts|md)$/,
        }).on("add", filename => {
            tryImport(filename);
        }).on("change", filename => {
            // remove previous hooks from the internal container
            this.clearCache(filename);
            tryImport(filename);
        }).on("unlink", this.clearCache.bind(this));
    }

    private clearCache(filename: string) {
        let path = filename.slice(0, -extname(filename).length);
        path && (Hook.Container[path] = {});
        delete require.cache[filename];
    }
}