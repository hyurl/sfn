import * as alar from "alar";
import { APP_PATH } from "../../init";
import { Service } from '../tools/Service';

declare global {
    namespace app {
        namespace services {
            const name: string;
            const path: string;
            /**
             * Pass this symbol to `instance()` method so that always gets the 
             * local instance of the module.
             */
            const local: symbol;
            /**
             * The basic service used in the core, it can be used in user 
             * project as well.
             */
            const base: ModuleProxy<Service>;
            function resolve(path: string): string;
            function serve(config: string | alar.RpcOptions): Promise<alar.RpcServer>;
            function connect(config: string | alar.ClientOptions): Promise<alar.RpcClient>;
            function watch(): alar.FSWatcher;
        }
    }
}

global["app"].services = new alar.ModuleProxy("app.services", APP_PATH + "/services");
global["app"].services.base = new alar.ModuleProxyBase(
    "app.services.base",
    __dirname + "/../tools/Service"
);