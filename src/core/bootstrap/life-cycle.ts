import { SSE } from 'sfn-sse';
import { Hook } from '../tools/Hook';
import { tryLogError } from '../tools/internal/error';
import get = require('lodash/get');
import { sleep } from '../tools/functions';

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

        if (app.rpc.server) {
            let { services = [] } = app.config.server.rpc[app.id];
            // If a service has a method called 'init()', call it to initiate the
            // service.
            for (let service of services) {
                if (typeof service.instance(app.local).destroy === "function") {
                    await service.instance(app.local).destroy();
                }
            }
        }

        process.exit();
    } catch (err) {
        process.exit(1);
    }
}).on("message", msg => {
    if (msg == "shutdown") { // compatible with Windows
        process.emit("SIGINT", "SIGINT");
    }
});

// Try to recover cached schedules from the previous shutdown.
app.hooks.lifeCycle.startup.bind(async () => {
    if (app.config.saveSchedules) {
        await app.services.schedule.instance(app.local).resume();
    }
});

// Try to stop the internal schedule service.
app.hooks.lifeCycle.shutdown.bind(async () => {
    if (app.config.saveSchedules) {
        await app.services.schedule.instance(app.local).stop();
    }
});

// Try to close http server.
app.hooks.lifeCycle.shutdown.bind(async () => {
    if (app.http) {
        await new Promise(resolve => {
            let timer = setTimeout(resolve, 500);

            app.http.close(() => {
                clearTimeout(timer);
                resolve();
            });
        });

        // close SSE connections.
        for (let id in app.sse) {
            app.sse[id].close();
        }

        await sleep(500);
    }
});

// Try to close ws server.
app.hooks.lifeCycle.shutdown.bind(async () => {
    if (app.ws) {
        await new Promise(resolve => {
            let timer = setTimeout(resolve, 500);

            app.ws.close(() => {
                clearTimeout(timer);
                resolve();
            });
        });
    }
});

// Subscribe an event listener so that when receives WebSocket message sent from
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
        data?: any[]
    }) => {
        let { target, volatile, local, event, data } = context;
        let ws = volatile ? app.ws.volatile : app.ws;

        ws = local ? ws.local : ws;

        let nsp = context.nsp ? ws.of(context.nsp) : ws;

        target && (nsp = nsp.to(target));

        nsp.emit(event, ...data);
    });
});

// Subscribes an event listener so that when receives SSE message sent from an 
// RPC server, the message can be delivered to the web client via the web
// server.
app.hooks.lifeCycle.startup.bind(() => {
    if (!app.sse) return;

    app.message.subscribe(app.message.sse.name, (context: {
        close?: boolean,
        target?: string,
        event?: string,
        data?: any
    }) => {
        let { close, target, event, data } = context;
        let targets: { [x: string]: SSE };

        if (target) {
            targets = { [target]: app.sse[target] };
        } else {
            targets = app.sse;
        }

        for (let id in targets) {
            let sse = app.sse[id];

            if (sse) {
                if (close) {
                    sse.close();
                } else if (event) {
                    sse.emit(event, data);
                } else {
                    sse.send(data);
                }
            }
        }
    });
});

// Subscribe an event listener so that when receives schedule task sent from an
// RPC server, the task can be invoked in the current server.
app.hooks.lifeCycle.startup.bind(() => {
    type Context = [string, string, any[]];

    app.message.subscribe(app.schedule.name, async (context: Context) => {
        let [modname, method, data] = context;
        let module: ModuleProxy<any> = get(global, modname, null);

        if (module) {
            try {
                await module.instance(app.local)[method](...(data || []));
            } catch (err) {
                tryLogError(err);
            }
        }
    });
});