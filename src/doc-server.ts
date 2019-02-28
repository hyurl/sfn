import "./bootstrap/rpc-config";
import "./index";

(async () => {
    await app.rpc.serve("doc-server");
    await app.rpc.connect("schedule-server");
})();