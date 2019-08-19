import { RpcServer, RpcClient } from "alar";
import { serveTip, inspectAs } from "../tools/internal";
import { green } from "../tools/internal/color";
import { serve as serveRepl } from "../tools/internal/repl";
import moment = require('moment');

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
            var connections: { [serverId: string]: RpcClient };

            /**
             * Starts an RPC server according to the given `serverId`, which is 
             * set in `config.server.rpc`.
             */
            function serve(serverId: string): Promise<void>;
            /**
             * Connects to an RPC server according to the given `serverId`, 
             * which is set in `config.server.rpc`. If `defer` is `true`, when 
             * the server is not online, the function will hang until it becomes
             * available and finishes the connection.
             */
            function connect(serverId: string, defer?: boolean): Promise<void>;
            /** Connects to all RPC servers. */
            function connectAll(defer?: boolean): Promise<void>;
            /**
             * Connects to all dependency services, by default, `serverId` is
             * the `app.serverId`, and don't have to pass it.
             */
            function connectDependencies(serverId?: string): Promise<void>;
            /** Checks if the target server is connected. */
            function hasConnect(serverId: string): boolean;
        }
    }
}

const tasks: { [id: string]: number } = {};

function ensureServerId(serverId: string): void {
    if (!app.config.server.rpc[serverId]) {
        throw new Error("The serverId is invalid");
    }
}

app.rpc = {
    server: null,
    connections: inspectAs({}, "[Sealed Object]"),
    async serve(serverId: string) {
        ensureServerId(serverId);

        let servers = app.config.server.rpc;
        let { services = [], ...options } = servers[serverId];
        let service = await app.services.serve(options);

        for (let mod of services) {
            service.register(mod);
        }

        app.rpc.server = service;
        app.serverId = serverId;

        // invoke all start-up hooks.
        await app.hooks.lifeCycle.startup.invoke();

        // If a service has a method called 'init()', call it to initiate the
        // service.
        for (let service of services) {
            if (typeof service.instance(app.local).init === "function") {
                await service.instance(app.local).init();
            }
        }

        console.log(serveTip("RPC", serverId, service.dsn));

        // self-connect after serving.
        await app.rpc.connect(serverId);

        // connect to dependency services.
        await app.rpc.connectDependencies(serverId);

        // try to serve the REPL server.
        await serveRepl(app.serverId);
    },
    async connect(serverId: string, defer = false) {
        ensureServerId(serverId);

        // prevent duplicated connect.
        if (app.rpc.hasConnect(serverId))
            return;

        try {
            let servers = app.config.server.rpc;
            let { services, ...options } = servers[serverId];
            let service = await app.services.connect({
                ...options,
                id: app.serverId
            });

            app.rpc.connections[serverId] = service;

            for (let mod of services) {
                service.register(mod);

                // If detects the schedule service is served by other processes
                // and being connected, stop the local schedule service.
                if (serverId !== app.serverId && mod === app.services.schedule) {
                    await app.services.schedule.instance(app.local).stop(true);
                }
            }

            if (tasks[serverId]) {
                app.schedule.cancel(tasks[serverId]);
                delete tasks[serverId];
            }

            // Link all the subscriber listeners from the message channel to
            // the RPC channel.
            app.message.linkRpcChannel(service);

            console.log(green`RPC server [${serverId}] connected.`);
        } catch (err) {
            if (defer) {
                if (!tasks[serverId]) {
                    tasks[serverId] = app.schedule.create({
                        salt: `connect-${serverId}`,
                        start: moment().unix(),
                        repeat: 1,
                    }, () => {
                        app.rpc.connect(serverId, defer);
                    });
                }
            } else {
                throw err;
            }
        }
    },
    async connectAll(defer = false) {
        let servers = app.config.server.rpc;
        let connections: Promise<void>[] = [];

        for (let serverId in servers) {
            if (serverId !== app.serverId) {
                connections.push(app.rpc.connect(serverId, defer));
            }
        }

        await Promise.all(connections);
    },
    async connectDependencies(serverId?: string) {
        serverId = serverId || app.serverId;
        let servers = app.config.server.rpc;
        let dependencies = servers[serverId]
            ? servers[serverId].dependencies
            : null;

        if (dependencies) {
            if (dependencies === "all") {
                await app.rpc.connectAll(true);
            } else {
                // used to prevent duplicated connections.
                let metServers: string[] = [];

                for (let dependency of dependencies) {
                    for (let id in servers) {
                        if (id !== app.serverId && !metServers.includes(id)) {
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
    hasConnect(serverId: string) {
        return !!app.rpc.connections[serverId];
    }
}