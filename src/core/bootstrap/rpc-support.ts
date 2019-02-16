import { green } from "../tools/functions-inner";
import { config } from "./load-config";

declare global {
    namespace app {
        function serveRPC(name: string): Promise<void>;
    }
}

app.serveRPC = serveRPC;

async function serveRPC(name: string) {
    let { modules, ...options } = config.server.rpc[name];
    let service = await app.services.serve(options);

    for (let mod of modules) {
        service.register(mod);
    }

    console.log(green`RPC server [${name}] started.`);
}

export async function connectRPC(name: string) {
    let timer: NodeJS.Timer;

    try {
        let { modules, ...options } = config.server.rpc[name];
        let service = await app.services.connect(options);

        for (let mod of modules) {
            service.register(mod);
        }

        timer && clearTimeout(timer);
        console.log(green`RPC server [${name}] connected.`);
    } catch (err) {
        timer = setTimeout(() => {
            connectRPC(name);
        }, config.server.rpc[name].timeout || 5000);
    }
}