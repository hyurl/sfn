import { isCli } from "../../init";
import { config } from "./load-config";
import { green } from "../tools/functions-inner";

declare global {
    namespace app {
        function serveRPC(name: string): Promise<void>;
    }
}

app.serveRPC = serveRPC;

const Connections: any[] = [];

async function serveRPC(name: string) {
    let { modules, ...options } = config.server.rpc[name];
    let service = await app.services.serve(options);

    for (let mod of modules) {
        service.register(mod);
    }

    console.log(green`RPC server [${name}] started.`);

    await connectRPC(name);
}

async function connectRPC(name: string) {
    let timer: NodeJS.Timer;

    if (Connections.includes(config.server.rpc[name]))
        return;

    try {
        let { modules, ...options } = config.server.rpc[name];
        let service = await app.services.connect(options);

        for (let mod of modules) {
            service.register(mod);
        }

        timer && clearTimeout(timer);
        console.log(green`RPC server [${name}] connected.`);

        Connections.push(config.server.rpc[name]);
    } catch (err) {
        timer = setTimeout(() => {
            connectRPC(name);
        }, config.server.rpc[name].timeout || 5000);
    }
}

if (!isCli) {
    (async () => {
        // connect RPC services
        if (config.server.rpc && Object.keys(config.server.rpc).length) {
            for (let name in config.server.rpc) {
                await connectRPC(name);
            }
        }
    })();
}