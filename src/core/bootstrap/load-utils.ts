import { FSWatcher, ModuleProxyApp } from "microse";
import { APP_PATH } from "../../init";
import define from '@hyurl/utils/define';

declare global {
    namespace app {
        namespace utils {
            const name: string;
            const path: string;
            function watch(): FSWatcher;
        }
    }
}

define(app, "utils", new ModuleProxyApp("app.utils", APP_PATH + "/utils"));
