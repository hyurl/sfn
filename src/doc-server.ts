import "sfn";

(async () => {
    await app.rpc.serve("doc-server");
    await app.rpc.connect("logger-server", true);
    await app.rpc.connect("schedule-server", true);
})();