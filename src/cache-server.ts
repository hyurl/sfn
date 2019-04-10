import "sfn";

// Sync cached data when the server starting up.
app.plugins.lifeCycle.startup.bind(async () => {
    await app.services.cache.instance(app.services.local).sync();
});

// Safely close the cache service when the server shutting down.
app.plugins.lifeCycle.shutdown.bind(async () => {
    await app.services.cache.instance(app.services.local).close();
});

app.rpc.serve("cache-server");