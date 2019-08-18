import { APP_PATH } from "../../init";
import { HookProxy } from '../tools/Hook';
import { FSWatcher } from "chokidar";

declare global {
    namespace app {
        namespace hooks {
            const name: string;
            const path: string;
            function watch(): FSWatcher;
        }
    }
}

global.app.hooks = new HookProxy("app.hooks", APP_PATH + "/hooks");