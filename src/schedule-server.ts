import "./bootstrap/rpc-config";
import "./index";

(async () => {
    await app.rpc.serve("schedule-server");
    app.schedule.run();
})();