import { DB } from 'modelar';
import { SSE } from 'sfn-sse';
import { Plugin } from '../tools/Plugin';
import { sleep } from '../tools/functions';

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