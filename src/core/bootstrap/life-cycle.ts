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

// Subscribe an event listener so that when receives WebSocket message sent from
// an RPC server, the message can be dilivered to the web client through a web
// server.
app.plugins.lifeCycle.startup.bind(() => {
    app.message.subscribe(app.message.ws.name, (context: {
        serverId?: string,
        nsp?: string,
        room?: string,
        volatile?: boolean,
        local?: boolean,
        event: string,
        data?: any[]
    }) => {
        if (context.serverId && app.serverId !== context.serverId)
            return;

        let ws = context.volatile ? app.ws.volatile : app.ws;

        ws = context.local ? ws.local : ws;

        let nsp = context.nsp ? ws.of(context.nsp) : ws;

        context.room && (nsp = nsp.to(context.room));

        nsp.emit(context.event, ...context.data);
    });
});

// Try to sync any cached data hosted by the default cache service.
app.plugins.lifeCycle.startup.bind(async () => {
    await app.services.internal.cache.sync();
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