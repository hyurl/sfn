import "sfn";

// Try to safely close the logger service.
app.plugins.lifeCycle.shutdown.bind(async () => {
    await app.services.logger.instance(app.services.local).close();
});

app.rpc.serve("logger-server");