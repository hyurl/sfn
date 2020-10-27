import { SSE } from 'sfn-sse';
import { ModuleProxy } from "microse";
import { Hook } from '../tools/Hook';
import { tryLogError } from '../tools/internal/error';
import { Controller } from '../controllers/Controller';
import { Service } from '../tools/Service';
import get = require('lodash/get');

declare global {
    namespace app {
        namespace hooks {
            namespace lifeCycle {
                const startup: Hook;
                const shutdown: Hook;
            }
        }
    }
}

// gracefully shutdown
process.on("SIGINT", async () => {
    try {
        await app.hooks.lifeCycle.shutdown.invoke();
        process.exit();
    } catch (err) {
        process.exit(1);
    }
}).on("message", msg => {
    if (msg == "shutdown") { // compatible with Windows
        process.emit("SIGINT", "SIGINT");
    }
});

// Try to close HTTP/WebSocket servers, RPC server and clients.
app.hooks.lifeCycle.shutdown.bind(async () => {
    let closures: Promise<any>[] = [];

    if (app.http) { // close HTTP server
        closures.push(new Promise(resolve => {
            let timeout = setTimeout(resolve, 2000);
            app.http.close(() => {
                clearTimeout(timeout);
                resolve();
            });
        }));

        // close SSE connections.
        app.sse.forEach(sse => {
            closures.push(new Promise(resolve => sse.close(resolve)));
        });
    }

    if (app.ws) { // close WebSocket server
        closures.push(new Promise(resolve => {
            let timeout = setTimeout(resolve, 2000);
            app.ws.close(() => {
                clearTimeout(timeout);
                resolve();
            });
        }));
    }

    // The RPC clients should be closed before the closing the server, since
    // a client will try to reconnect if lost connection from the server.
    for (let id in app.rpc.connections) { // close RPC clients
        let client = app.rpc.connections[id];
        closures.push(client.close());
    }

    if (app.rpc.server) { // close RPC server
        closures.push(app.rpc.server.close());
    }

    await Promise.all(closures);
});

// Subscribe an topic listener so that when receives WebSocket message sent from
// an RPC server, the message can be delivered to the web client via the web
// server.
app.hooks.lifeCycle.startup.bind(() => {
    if (!app.ws) return;

    app.message.subscribe(app.message.ws.name, (context: {
        nsp?: string,
        target?: string,
        volatile?: boolean,
        local?: boolean,
        event: string,
        data?: any[];
    }) => {
        let { target, volatile, local, event, data } = context;
        let ws = volatile ? app.ws.volatile : app.ws;
        ws = local ? ws.local : ws;
        let nsp = context.nsp ? ws.of(context.nsp) : ws;

        target && (nsp = nsp.to(target));
        nsp.emit(event, ...data);
    });
});

// Subscribes an topic listener so that when receives SSE message sent from an 
// RPC server, the message can be delivered to the web client via the web
// server.
app.hooks.lifeCycle.startup.bind(() => {
    if (!app.sse) return;

    app.message.subscribe(app.message.sse.name, (context: {
        close?: boolean,
        target?: string,
        event?: string,
        data?: any;
    }) => {
        let { close, target, event, data } = context;
        let dispatch = (sse: SSE) => {
            if (close) {
                sse.close();
            } else if (event) {
                sse.emit(event, data);
            } else {
                sse.send(data);
            }
        };

        if (target) {
            let sse = app.sse.get(target);
            sse && dispatch(sse);
        } else {
            app.sse.forEach(dispatch);
        }
    });
});

// Subscribe an topic listener so that when receives schedule task sent from an
// RPC server, the task can be invoked in the current server.
app.hooks.lifeCycle.startup.bind(() => {
    type Context = [string, string, any[]];

    app.message.subscribe(app.schedule.name, async (context: Context) => {
        let [modName, method, data] = context;
        let mod: ModuleProxy<any> = get(global, modName, null);

        if (mod) {
            try {
                if (typeof mod.proto?.[method] === "function") {
                    await mod[method](...(data || []));
                }
            } catch (err) {
                tryLogError(err);
            }
        }
    });
});

// Initiate the static property Controller.flow.
app.hooks.lifeCycle.startup.bind(async () => {
    Controller.flow = new class extends Service { };
    await Controller.flow.init?.();
});

// GC static property Controller.flow.
app.hooks.lifeCycle.shutdown.bind(async () => {
    Controller.flow?.destroy?.();
});
