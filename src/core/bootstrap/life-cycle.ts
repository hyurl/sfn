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

app.plugins.lifeCycle.startup.bind(async () => {
    // try to sync any cached data hosted by the default cache service.
    await app.services.internal.cache.sync();
});

// try to close all database connections
app.plugins.lifeCycle.shutdown.bind(async () => {
    DB.close();
    await sleep(500);
});

// try to close all caches
app.plugins.lifeCycle.shutdown.bind(async () => {
    for (let filename in Service.Caches) {
        await Service.Caches[filename].close();
    }
});

// try to close http server
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

// try to close ws server
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