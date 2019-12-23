import { RpcServer, RpcClient } from "alar";
import { serveTip, inspectAs } from "../tools/internal";
import { green } from "../tools/internal/color";
import { serve as serveRepl } from "../tools/internal/repl";

let isMainThread: boolean;

try {
    isMainThread = require("@hyurl/goroutine").isMainThread;
} catch (e) {
    try {
        isMainThread = require("worker_threads").isMainThread;
    } catch (e) {
        isMainThread = !process.send || !!process.env.NODE_APP_INSTANCE;
    }
}

declare global {
    namespace app {
        namespace rpc {
            /**
             * The RPC server instance, only available when the current process 
             * is an RPC server (and the server started), if it's a web server,
             * the variable will be `null`.
             */
            var server: RpcServer;

            /** @inner reserved portal used by the framework */
            var connections: { [id: string]: RpcClient };

            /**
             * Starts an RPC server according to the given `id`, which is 
             * set in `config.server.rpc`.
             */
            function serve(id: string): Promise<void>;
            /**
             * Connects to an RPC server according to the given `id`, 
             * which is set in `config.server.rpc`. If `defer` is `true`, when 
             * the server is not online, the function will hang until it becomes
             * available and finishes the connection.
             */
            function connect(id: string, defer?: boolean): Promise<void>;
            /** Connects to all RPC servers. */
            function connectAll(defer?: boolean): Promise<void>;
            /**
             * Connects to all dependency services, by default, `id` is
             * the `app.id`, and don't have to pass it.
             */
            function connectDependencies(id?: string): Promise<void>;
            /** Checks if the target server is connected. */
            function hasConnect(id: string): boolean;
        }
    }
}

const tasks: { [id: string]: string } = {};
const connectings = new Set<string>();

function ensureAppId(id: string): void {
    if (!app.config.server.rpc[id]) {
        throw new Error(`The app ID '${id}' is invalid`);
    }
}

async function tryConnect(id: string, supressError = false) {
    ensureAppId(id);

    // prevent duplicated connect.
    if (connectings.has(id)) {
        return false;
    } else {
        connectings.add(id);
    }

    try {
        let servers = app.config.server.rpc;
        let { services, ...options } = servers[id];
        let service = await app.services.connect({
            ...options,
            id: app.id
        });

        app.rpc.connections[id] = service;
        services.forEach(mod => service.register(mod));

        // If detects the schedule service is served by other processes and
        // being connected, stop the local schedule service.
        if (id !== app.id && services.includes(app.services.schedule)) {
            await app.services.schedule.instance(app.local).destroy(true);
        }

        if (tasks[id]) {
            app.schedule.cancel(tasks[id]);
            delete tasks[id];
        }

        // Link all the subscriber listeners from the message channel to
        // the RPC channel.
        app.message.linkRpcChannel(service);

        connectings.delete(id);

        if (isMainThread) {
            console.log(green`RPC server [${id}] connected.`);
        }

        return true;
    } catch (err) {
        connectings.delete(id);

        if (!supressError) {
            throw err;
        } else {
            return false;
        }
    }
}

app.rpc = {
    server: null,
    connections: inspectAs({}, "[Sealed Object]"),
    async serve(id: string) {
        ensureAppId(id);

        let servers = app.config.server.rpc;
        let { services = [], ...options } = servers[id];
        let service = await app.services.serve({
            ...options,
            id,
            host: "0.0.0.0"
        });

        services.forEach(mod => service.register(mod));
        app.rpc.server = service;
        app.id = id;

        // invoke all start-up hooks.
        await app.hooks.lifeCycle.startup.invoke();

        console.log(serveTip("RPC", id, service.dsn));

        // self-connect after serving.
        await app.rpc.connect(id);
        // connect to dependency services.
        await app.rpc.connectDependencies(id);

        // try to serve the REPL server.
        await serveRepl(app.id);

        // initiating registered services.
        await service.init();

        if (!app.isDevMode) { // notify PM2 that the service is available.
            process.send("ready");
        }
    },
    async connect(id: string, defer = false) {
        let ok = await tryConnect(id, defer);

        if (!ok && defer) {
            tasks[id] = app.schedule.create({
                salt: `connect-${id}`,
                startIn: 1,
                repeat: 1,
                handler: tryConnect,
                data: [id, defer]
            });
        }
    },
    async connectAll(defer = false) {
        await Promise.all(
            Object.keys(app.config.server.rpc || {})
                .filter(id => id !== app.id)
                .map(id => app.rpc.connect(id, defer))
        );
    },
    async connectDependencies(id?: string) {
        id = id || app.id;
        let servers = app.config.server.rpc;
        let dependencies = servers[id]
            ? servers[id].dependencies
            : null;

        if (dependencies === "all") {
            await app.rpc.connectAll(true);
        } else if (Array.isArray(dependencies)) {
            // used to prevent duplicated connections.
            let metServers: string[] = [];
            let connections: Promise<void>[] = [];

            for (let dependency of dependencies) {
                for (let id in servers) {
                    if (id !== app.id &&
                        !metServers.includes(id) &&
                        servers[id].services.includes(dependency)) {
                        metServers.push(id);
                        connections.push(app.rpc.connect(id, true));
                    }
                }
            }

            await Promise.all(connections);
        }
    },
    hasConnect(id: string) {
        return !!app.rpc.connections[id];
    }
}