import { APP_PATH } from "../../init";
import { HookProxy } from '../tools/Hook';
import { FSWatcher } from "chokidar";
import define from '@hyurl/utils/define';

declare global {
    namespace app {
        namespace hooks {
            const name: string;
            const path: string;
            function watch(): FSWatcher;
        }
    }
}

define(app, "hooks", new HookProxy("app.hooks", APP_PATH + "/hooks"));