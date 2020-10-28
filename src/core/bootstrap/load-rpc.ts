import { RpcServer, RpcClient } from "microse";
import { serveTip, inspectAs } from "../tools/internal";
import { green } from "../tools/internal/color";
import { serve as serveRepl } from "../tools/internal/repl";
import define from "@hyurl/utils/define";

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
             * is an RPC server (and the server is running), if it's a web
             * server, the variable will be `null`.
             */
            var server: RpcServer;

            /** @inner reserved portal used by the framework */
            var connections: { [id: string]: RpcClient; };

            /**
             * Starts an RPC server according to the given `id`, which is 
             * set in `config.server.rpc`.
             */
            function serve(id: string): Promise<void>;
            /**
             * Connects to an RPC server according to the given `id`, 
             * which is set in `config.server.rpc`. If `defer` is `true`, when 
             * the server is not online, the function will hang in the
             * background until it becomes available and finishes the connection.
             */
            function connect(id: string, defer?: boolean): Promise<void>;
            /** Connects to all RPC servers. */
            function connectAll(defer?: boolean): Promise<void>;
            /**
             * Connects to all dependency services, by default, `id` is
             * the `app.id`, and don't have to pass it. But if the `app.id`
             * is not set in `config.server.rpc`, it needs to be provided
             * explicitly.
             */
            function connectDependencies(id?: string): Promise<void>;
            /** Checks if the target server is connected. */
            function hasConnect(id: string): boolean;
        }
    }
}

const tasks: { [id: string]: NodeJS.Timer; } = {};
const pendingConnections = new Set<string>();

function ensureAppId(id: string): void {
    if (!app.config.server.rpc[id]) {
        throw new Error(`The app ID '${id}' is invalid`);
    }
}

async function tryConnect(
    serverId: string,
    defer = false
) {
    ensureAppId(serverId);

    // prevent duplicated connect.
    if (pendingConnections.has(serverId)) {
        return false;
    } else {
        pendingConnections.add(serverId);
    }

    try {
        let servers = app.config.server.rpc;
        let { services, ...options } = servers[serverId];
        let client = await app.services.connect({
            ...options,
            id: app.id,
            serverId
        });

        app.rpc.connections[serverId] = client;

        // If detects the schedule service is served by other processes and
        // being connected, stop the local schedule service.
        if (serverId !== app.id && services.includes(app.services.schedule)) {
            await app.services.schedule.destroy(true);
        }

        // Once connected, bind all existing topics and handlers from
        // MessageChannel to the RpcClient so that the RpcServer can publish
        // message to them.
        client["topics"] = app.message["topics"];

        for (let mod of services) {
            await client.register(mod);
        }

        if (tasks[serverId]) {
            clearInterval(tasks[serverId]);
            delete tasks[serverId];
        }

        pendingConnections.delete(serverId);

        if (isMainThread && serverId !== app.id) {
            console.log(green`RPC server [${serverId}] connected.`);
        }

        return true;
    } catch (err) {
        pendingConnections.delete(serverId);

        if (!defer) {
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

        define(app, "id", id, true);
        await app.rpc.connectDependencies(id); // connect to dependency services.
        await app.hooks.lifeCycle.startup.invoke(); // invoke start-up hooks.

        let servers = app.config.server.rpc;
        let { services = [], ...options } = servers[app.id];
        let server = app.rpc.server = await app.services.serve({
            ...options,
            id: app.id,
            hostname: "0.0.0.0"
        });

        for (let mod of services) {
            await server.register(mod);
        }

        await tryConnect(app.id); // self-connect after serving.
        await serveRepl(app.id); // serve the REPL server.

        console.log(serveTip("RPC", app.id, server.dsn));

        if (!app.isDevMode) { // notify PM2 that the service is available.
            process.send("ready");
        }
    },
    async connect(id: string, defer = false) {
        if (!(await tryConnect(id, defer)) && defer) {
            tasks[id] = setInterval(tryConnect, 1000, id, defer);
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
};
