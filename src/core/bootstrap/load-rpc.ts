import { config } from "./load-config";
import { green } from "../tools/functions-inner";

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
             * set in `config.server.rpc`.
             */
            function connect(name: string): Promise<void>;
            /** Connects to all RPC servers. */
            function connectAll(): Promise<void>;
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
    async connect(name: string) {
        let { modules, ...options } = rpc[name];
        let service = await app.services.connect(options);

        for (let mod of modules) {
            service.register(mod);
        }

        console.log(green`RPC server [${name}] connected.`);
    },
    async connectAll() {
        for (let name in rpc) {
            await app.rpc.connect(name);
        }
    }
}