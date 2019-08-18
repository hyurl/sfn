import * as alar from "alar";
import { APP_PATH } from "../../init";
import { Controller } from '../controllers/Controller';
import { createImport } from '../tools/internal/module';

declare global {
    namespace app {
        const controllers: alar.ModuleProxy & {
            [x: string]: ModuleProxy<Controller>
        };
    }
}

global.app.controllers = new alar.ModuleProxy(
    "app.controllers",
    APP_PATH + "/controllers"
);

// Rewrite watch method for more advanced functions.
const tryImport = createImport(require);
const _watch: () => alar.FSWatcher = app.controllers.watch.bind(app.controllers);
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