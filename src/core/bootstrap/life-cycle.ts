import { Plugin } from '../tools/Plugin';
import { DB } from 'modelar';
import { sleep } from '../tools/functions';
import { Service } from '../tools/Service';

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

// Try to sync any cached data hosted by the default cache service.
app.plugins.lifeCycle.startup.bind(async () => {
    await app.services.base.instance(app.services.local).cache.sync();
});

// Try to close all database connections.
app.plugins.lifeCycle.shutdown.bind(async () => {
    DB.close();
    await sleep(500);
});

// Try to close all caches.
app.plugins.lifeCycle.shutdown.bind(async () => {
    for (let filename in Service.Caches) {
        await Service.Caches[filename].close();
    }
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
// an RPC server, the message can be delivered to the web client through the web
// server.
app.plugins.lifeCycle.startup.bind(() => {
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
// RPC server, the message can be delivered to the web client through the web
// server.
app.plugins.lifeCycle.startup.bind(() => {
    app.message.subscribe(app.message.sse.name, (context: {
        close?: boolean,
        target?: number,
        event: string,
        id?: string,
        retry?: number,
        data?: any[]
    }) => {
        let { close, target, event, id, retry, data } = context;
        let sse = app.sse[target];

        if (sse) {
            if (close) {
                sse.close();
            } else if (event) {
                sse.send(event, data, id, retry);
            } else {
                sse.send(data, id, retry);
            }
        }
    });
});