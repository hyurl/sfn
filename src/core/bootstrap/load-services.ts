import {
    RpcServer,
    ServerOptions,
    RpcClient,
    ClientOptions,
    FSWatcher,
    ModuleProxyApp
} from "microse";
import { APP_PATH } from "../../init";
import define from '@hyurl/utils/define';

declare global {
    namespace app {
        namespace services {
            const name: string;
            const path: string;
            /** @inner This function is for internal use. */
            function serve(
                config: ServerOptions
            ): Promise<RpcServer>;
            /** @inner This function is for internal use. */
            function connect(
                config: ClientOptions
            ): Promise<RpcClient>;
            /** @inner This function is for internal use. */
            function watch(): FSWatcher;
        }
    }
}

define(app,
    "services",
    new ModuleProxyApp("app.services", APP_PATH + "/services"));
