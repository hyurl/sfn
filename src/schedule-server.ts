import "sfn";

// Try to recover cached schedules from the previous shutdown.
app.plugins.lifeCycle.startup.bind(async () => {
    await app.services.schedule.instance(app.services.local).resume();
});

// Try to safely stop the schedule service.
app.plugins.lifeCycle.shutdown.bind(async () => {
    await app.services.schedule.instance(app.services.local).stop();
});

app.rpc.serve("schedule-server");