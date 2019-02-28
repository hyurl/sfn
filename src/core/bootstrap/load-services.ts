import * as alar from "alar";
import { APP_PATH } from "../../init";
import { Service } from '../tools/Service';

declare global {
    namespace app {
        namespace services {
            const name: string;
            const path: string;
            const local: symbol;
            /**
             * The default service used in the core, it can be used in user 
             * project as well.
             */
            const internal: Service;
            function resolve(path: string): string;
            function serve(config: string | alar.RpcOptions): Promise<alar.RpcServer>;
            function connect(config: string | alar.RpcOptions): Promise<alar.RpcClient>;
            function watch(): alar.FSWatcher;
        }
    }
}

global["app"].services = new alar.ModuleProxy("app.services", APP_PATH + "/services");
export default global["app"].services.internal = new Service();