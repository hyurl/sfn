import { normalize, extname } from 'path';
import { watch } from "chokidar";
import { applyMagic } from 'js-magic';
import { interceptAsync } from 'function-intercept';
import { createImport, traceModulePath } from './internal/module';

const tryImport = createImport(require);

/**
 * The base class used to create hook instance when accessing hook chains.
 */
@applyMagic
export abstract class Hook<I = void, O = void> {
    /**
     * The name of the hook, when accessing a hook via `app.hooks`, this
     * property will be set automatically.
     */
    abstract readonly name: string;
    protected abstract path: string;
    protected abstract children: { [name: string]: Hook; };

    /** Binds a handler function to the current hook. */
    bind(handler: (input?: I, output?: O) => void | O | Promise<void | O>) {
        let path = traceModulePath(this.path) || "<internal>";
        let container = Hook.Container.get(path);
        container || Hook.Container.set(path, container = new Map());
        let handlers = container.get(this.name);
        handlers || container.set(this.name, handlers = new Set());

        handlers.add(handler);
        return this;
    }

    /** Invokes all handler functions bound to the hook. */
    async invoke(input?: I, output?: O): Promise<O> {
        let result: O;

        for (let handler of this.getHandlers()) {
            let res = await handler(input, output);
            res === undefined || (result = res);
            await new Promise(setImmediate); // Ensure asynchronous call.
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

    /** Returns all handlers bound to the current hook. */
    getHandlers() {
        let handlers: Function[] = [];

        Hook.Container.forEach(container => {
            let _handlers = container.get(this.name);

            if (_handlers && _handlers.size > 0) {
                handlers.push(..._handlers);
            }
        });

        return handlers;
    }

    protected __get(prop: string) {
        if (prop in this) {
            return this[prop];
        } else if (prop in this.children) {
            return this.children[prop];
        } else if (typeof prop != "symbol") {
            // Create the Hook instance from prototype and patch properties
            // since this is an abstract class.
            return this.children[prop] = applyMagic(Object.assign(
                Object.create(Hook.prototype), {
                name: this.name + "." + String(prop),
                path: this.path,
                children: {}
            }), true);
        }
    }

    protected __has(prop: string) {
        return (prop in this) || (prop in this.children);
    }
}

export namespace Hook {
    export const Container = new Map<string, Map<string, Set<Function>>>();
}

export class HookProxy extends Hook {
    readonly name: string;
    protected path: string;
    protected children = {};

    constructor(name: string, path: string) {
        super();
        this.name = name;
        this.path = normalize(path);
    }

    watch() {
        return watch(this.path, {
            followSymlinks: false,
            awaitWriteFinish: true,
            ignored: (file: string) => !/\.(ts|js)$/.test(extname(file))
        }).on("add", filename => {
            tryImport(filename);
        }).on("change", filename => {
            this.clearCache(filename); // remove previous hooks from the cache
            tryImport(filename); // import the modified module
        }).on("unlink", this.clearCache.bind(this));
    }

    private clearCache(filename: string) {
        let path = filename.slice(0, -extname(filename).length);
        path && (Hook.Container.delete(path));
        delete require.cache[filename]; // delete module cache
    }
}
