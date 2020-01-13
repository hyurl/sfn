import * as alar from "alar";
import { APP_PATH } from "../../init";

declare global {
    namespace app {
        namespace services {
            const name: string;
            const path: string;
            /** @inner This function is for internal use. */
            function serve(config: alar.RpcOptions, immediate?: boolean): Promise<alar.RpcServer>;
            /** @inner This function is for internal use. */
            function connect(config: alar.ClientOptions, immediate?: boolean): Promise<alar.RpcClient>;
            /** @inner This function is for internal use. */
            function watch(): alar.FSWatcher;
        }
    }
}

global.app.services = new alar.ModuleProxy("app.services", APP_PATH + "/services");