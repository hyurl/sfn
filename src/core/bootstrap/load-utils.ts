import * as alar from "alar";
import { APP_PATH } from "../../init";
import define from '@hyurl/utils/define';

declare global {
    namespace app {
        namespace utils {
            const name: string;
            function watch(): alar.FSWatcher;
        }
    }
}

define(app, "utils", new alar.ModuleProxy("app.utils", APP_PATH + "/utils"));