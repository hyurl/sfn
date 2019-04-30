import { DB } from 'modelar';
import { SSE } from 'sfn-sse';
import { Plugin } from '../tools/Plugin';
import { sleep } from '../tools/functions';
import { tryLogError } from '../tools/internal/error';
import get = require('lodash/get');

declare global {
    namespace app {
        namespace plugins {
            namespace lifeCycle {
                const startup: Plugin;
                const shutdown: Plugin;
            }
        }
    }
}

// gracefully shutdown
process.on("SIGINT", async () => {
    try {
        await app.plugins.lifeCycle.shutdown.invoke();
        process.exit();
    } catch (err) {
        process.exit(1);
    }
}).on("message", msg => {
    if (msg == "shutdown") { // compatible with Windows
        process.emit("SIGINT", "SIGINT");
    }
});

// Try to close all database connections.
app.plugins.lifeCycle.shutdown.bind(async () => {
    DB.close();
    await sleep(500);
});

// Try to recover cached schedules from the previous shutdown.
app.plugins.lifeCycle.startup.bind(async () => {
    await app.services.schedule.instance(app.services.local).resume();
});

// Try to stop the internal schedule service.
app.plugins.lifeCycle.shutdown.bind(async () => {
    await app.services.schedule.instance(app.services.local).stop();
});

// Try to close http server.
app.plugins.lifeCycle.shutdown.bind(async () => {
    if (app.http) {
        await new Promise(resolve => {
            let timer = setTimeout(resolve, 500);

            app.http.close(() => {
                clearTimeout(timer);
                resolve();
            });
        });
    }
});

// Try to close ws server.
app.plugins.lifeCycle.shutdown.bind(async () => {
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
app.plugins.lifeCycle.startup.bind(() => {
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
app.plugins.lifeCycle.startup.bind(() => {
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
// RPC server, the task can task can be invoked in the current server.
app.plugins.lifeCycle.startup.bind(() => {
    app.message.subscribe(app.schedule.name, async (context: any[]) => {
        let [module, method, data] = context;
        let mod: ModuleProxy<any> = get(global, module, null);

        if (mod) {
            try {
                await mod.instance(app.services.local)[method](data);
            } catch (err) {
                tryLogError(err);
            }
        }
    });
});