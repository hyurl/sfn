import * as alar from "alar";
import { APP_PATH } from "../../init";

declare global {
    namespace app {
        namespace models {
            const name: string;
            const path: string;
            /**
             * Pass this symbol to `instance()` method so that always gets the
             * local instance of the module.
             */
            const local: symbol;
            function resolve(path: string): string;
            function serve(config: string | alar.RpcOptions): Promise<alar.RpcServer>;
            function connect(config: string | alar.RpcOptions): Promise<alar.RpcClient>;
            function watch(): alar.FSWatcher;
        }
    }
}

global["app"].models = new alar.ModuleProxy("app.models", APP_PATH + "/models");