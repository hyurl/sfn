import { RpcServer, RpcClient } from "alar";
import { serveTip, inspectAs } from "../tools/internal";
import { green } from "../tools/internal/color";
import { serve as serveRepl } from "../tools/internal/repl";

let isMainThread: boolean;

try {
    isMainThread = require("go-routine").isMainThread;
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
        return;
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

        for (let mod of services) {
            service.register(mod);

            // If detects the schedule service is served by other
            // processes and being connected, stop the local schedule
            // service.
            if (id !== app.id && mod === app.services.schedule) {
                await app.services.schedule.instance(app.local)
                    .stop(true);
            }
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
    } catch (err) {
        connectings.delete(id);

        if (!supressError) {
            throw err;
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

        for (let mod of services) {
            service.register(mod);
        }

        app.rpc.server = service;
        app.id = id;

        // invoke all start-up hooks.
        await app.hooks.lifeCycle.startup.invoke();

        // If a service has a method called 'init()', call it to initiate the
        // service.
        for (let service of services) {
            if (typeof service.instance(app.local).init === "function") {
                await service.instance(app.local).init();
            }
        }

        console.log(serveTip("RPC", id, service.dsn));

        // self-connect after serving.
        await app.rpc.connect(id);

        // connect to dependency services.
        await app.rpc.connectDependencies(id);

        // try to serve the REPL server.
        await serveRepl(app.id);

        if (!app.isDevMode) {
            // notify PM2 that the service is available.
            process.send("ready");
        }
    },
    async connect(id: string, defer = false) {
        if (!defer) {
            return tryConnect(id);
        } else {
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
        let servers = app.config.server.rpc;
        let connections: Promise<void>[] = [];

        for (let id in servers) {
            if (id !== app.id) {
                connections.push(app.rpc.connect(id, defer));
            }
        }

        await Promise.all(connections);
    },
    async connectDependencies(id?: string) {
        id = id || app.id;
        let servers = app.config.server.rpc;
        let dependencies = servers[id]
            ? servers[id].dependencies
            : null;

        if (dependencies) {
            if (dependencies === "all") {
                await app.rpc.connectAll(true);
            } else {
                // used to prevent duplicated connections.
                let metServers: string[] = [];

                for (let dependency of dependencies) {
                    for (let id in servers) {
                        if (id !== app.id && !metServers.includes(id)) {
                            if (servers[id].services.includes(dependency)) {
                                metServers.push(id);
                                await app.rpc.connect(id, true);
                            }
                        }
                    }
                }
            }
        }
    },
    hasConnect(id: string) {
        return !!app.rpc.connections[id];
    }
}