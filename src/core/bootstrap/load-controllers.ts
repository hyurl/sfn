import { ModuleProxyApp, ModuleProxy, FSWatcher } from "microse";
import { APP_PATH } from "../../init";
import { Controller } from '../controllers/Controller';
import { createImport } from '../tools/internal/module';
import define from '@hyurl/utils/define';

declare global {
    namespace app {
        const controllers: ModuleProxyApp & {
            [x: string]: ModuleProxy<Controller>
        };
    }
}

define(app,
    "controllers",
    new ModuleProxyApp("app.controllers", APP_PATH + "/controllers"));

// Rewrite watch method for more advanced functions.
const tryImport = createImport(require);
const _watch: () => FSWatcher = app.controllers.watch.bind(app.controllers);

app.controllers.watch = () => {
    if (app.isWebServer) {
        return _watch().on("add", autoLoad).on("change", autoLoad);
    } else {
        return null;
    }
};

function autoLoad(filename: string) {
    app.controllers.resolve(filename) && tryImport(filename);
}
