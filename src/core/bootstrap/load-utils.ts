import * as alar from "alar";
import { APP_PATH } from "../../init";

declare global {
    namespace app {
        namespace utils {
            const name: string;
            function watch(): alar.FSWatcher;
        }
    }
}

global.app.utils = new alar.ModuleProxy("app.utils", APP_PATH + "/utils");