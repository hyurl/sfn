import * as alar from "alar";
import { APP_PATH } from "../../init";

declare global {
    namespace app {
        namespace services {
            const name: string;
            const path: string;
            function resolve(path: string): string;
            function serve(config: string | alar.RpcOptions): Promise<alar.RpcChannel>;
            function connect(config: string | alar.RpcOptions): Promise<alar.RpcChannel>;
            function watch(): alar.FSWatcher;
        }
    }
}

global["app"].services = new alar.ModuleProxy("services", APP_PATH + "/services");