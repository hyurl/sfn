import { RpcServer, RpcClient } from "alar";
import { config } from "./load-config";
import { green } from "../tools/functions-inner";
import { sleep } from '../tools/functions';

declare global {
    namespace app {
        namespace rpc {
            var server: RpcServer;
            var clients: RpcClient[];

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

const rpc = config.server.rpc || {};

app.rpc = {
    server: null,
    clients: [],
    async serve(serverId: string) {
        let { modules, ...options } = rpc[serverId];
        let service = await app.services.serve(options);

        for (let mod of modules) {
            service.register(mod);
        }

        app.rpc.server = service;
        app.serverId = serverId;
        console.log(green`RPC server [${serverId}] started.`);
    },
    async connect(serverId: string, defer = false) {
        try {
            let { modules, ...options } = rpc[serverId];
            let service = await app.services.connect(options);

            for (let mod of modules) {
                service.register(mod);
            }

            app.rpc.clients.push(service);

            // Copy all the event listeners from the message queue and subscribe
            // them to the RPC client.
            for (let event in app.message.events) {
                for (let listener of app.message.events[event]) {
                    service.subscribe(event, <any>listener);
                }
            }

            console.log(green`RPC server [${serverId}] connected.`);
        } catch (err) {
            console.log(err);
            if (defer) {
                await sleep(5000);
                return app.rpc.connect(serverId, defer);
            } else {
                throw err;
            }
        }
    },
    async connectAll(defer = false) {
        let connections: Promise<void>[] = [];

        for (let serverId in rpc) {
            connections.push(app.rpc.connect(serverId, defer));
        }

        await Promise.all(connections);
    }
}