import { config } from "./load-config";
import { green } from "../tools/functions-inner";
import { sleep } from '../tools/functions';

declare global {
    namespace app {
        namespace rpc {
            /**
             * Starts an RPC server according to the given `name`, which is set 
             * in `config.server.rpc`.
             */
            function serve(name: string): Promise<void>;
            /**
             * Connects to an RPC server according to the given `name`, which is
             * set in `config.server.rpc`. If `defer` is `true`, when the server
             * is not online, the function will hang until it becomes available 
             * and finishes the connection.
             */
            function connect(name: string, defer?: boolean): Promise<void>;
            /** Connects to all RPC servers. */
            function connectAll(defer?: boolean): Promise<void>;
        }
    }
}

const rpc = config.server.rpc || {};

app.rpc = {
    async serve(name: string) {
        let { modules, ...options } = rpc[name];
        let service = await app.services.serve(options);

        for (let mod of modules) {
            service.register(mod);
        }

        console.log(green`RPC server [${name}] started.`);
    },
    async connect(name: string, defer = false) {
        try {
            let { modules, ...options } = rpc[name];
            let service = await app.services.connect(options);

            for (let mod of modules) {
                service.register(mod);
            }

            console.log(green`RPC server [${name}] connected.`);
        } catch (err) {
            if (defer) {
                await sleep(5000);
                return app.rpc.connect(name, defer);
            } else {
                throw err;
            }
        }
    },
    async connectAll(defer = false) {
        let connections: Promise<void>[] = [];

        for (let name in rpc) {
            connections.push(app.rpc.connect(name, defer));
        }

        await Promise.all(connections);
    }
}