import { isCli } from '../../init';
import { config } from "./load-config";
import { createImport } from '../tools/functions-inner';

const tryImport = createImport(require);

// hot-reloading
if (!isCli && config.hotReloading) {
    app.services.watch();
    app.models.watch();
    app.utils.watch();
    app.locales.watch();
    app.plugins.watch();
}

export function watchWebModules() {
    if (!isCli && config.hotReloading) {
        app.views.watch();

        // hot-reload controllers
        let autoLoad = (filename: string) => {
            app.controllers.resolve(filename) && tryImport(filename);
        };

        app.controllers.watch().on("add", autoLoad).on("change", autoLoad);
    }
}