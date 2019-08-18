import * as alar from "alar";
import { APP_PATH } from "../../init";

declare global {
    namespace app {
        namespace models {
            const name: string;
            const path: string;
            function watch(): alar.FSWatcher;
        }
    }
}

global.app.models = new alar.ModuleProxy("app.models", APP_PATH + "/models");