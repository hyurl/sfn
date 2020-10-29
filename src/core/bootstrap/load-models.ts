import define from "@hyurl/utils/define";
import { FSWatcher, ModuleProxyApp } from "microse";
import { APP_PATH } from "../../init";

declare global {
    namespace app {
        namespace models {
            const name: string;
            const path: string;
            function watch(): FSWatcher;
        }
    }
}

define(app, "models", new ModuleProxyApp("app.models", APP_PATH + "/models"));
