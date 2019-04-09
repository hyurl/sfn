import { ROOT_PATH } from "sfn";

(async () => {
    await app.rpc.serve("logger-server");
    await app.services.logger.instance().setUp({
        filename: ROOT_PATH + "/logs/sfn.log"
    });
})();