import { RpcServer, RpcClient } from "alar";
import { config } from "./load-config";
import { serveTip } from "../tools/internal";
import { green } from "../tools/internal/color";

declare global {
    namespace app {
        namespace rpc {
            var server: RpcServer;
            var connections: RpcClient[];

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
        }
    }
}

const timers: { [id: string]: NodeJS.Timer } = {};

app.rpc = {
    server: null,
    connections: [],
    async serve(serverId: string) {
        let servers = config.server.rpc;
        let { modules, ...options } = servers[serverId];
        let service = await app.services.serve(options);

        for (let mod of modules) {
            service.register(mod);
        }

        app.rpc.server = service;
        app.serverId = serverId;
        console.log(serveTip("RPC", serverId, service.dsn));

        await app.rpc.connect(serverId);
    },
    async connect(serverId: string, defer = false) {
        try {
            let servers = config.server.rpc;
            let { modules, ...options } = servers[serverId];
            let service = await app.services.connect({
                ...options,
                id: app.serverId
            });

            for (let mod of modules) {
                service.register(mod);
            }

            app.rpc.connections.push(service);

            if (timers[serverId]) {
                clearInterval(timers[serverId]);
                delete timers[serverId];
            }

            // Link all the subscriber listeners from the message channel and to
            // the RPC channel.
            app.message.linkRpcChannel(service);

            console.log(green`RPC server [${serverId}] connected.`);
        } catch (err) {
            if (defer) {
                if (!timers[serverId]) {
                    timers[serverId] = setInterval(() => {
                        app.rpc.connect(serverId, defer);
                    }, 5000);
                }
            } else {
                throw err;
            }
        }
    },
    async connectAll(defer = false) {
        let servers = config.server.rpc;
        let connections: Promise<void>[] = [];

        for (let serverId in servers) {
            if (serverId !== app.serverId) {
                connections.push(app.rpc.connect(serverId, defer));
            }
        }

        await Promise.all(connections);
    }
}