import "sfn";

(async () => {
    await app.rpc.serve("doc-server");
    await app.rpc.connect("schedule-server", true);
})();