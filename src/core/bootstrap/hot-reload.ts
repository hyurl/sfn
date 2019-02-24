import { isCli } from '../../init';
import { config } from "./load-config";
import { createImport } from '../tools/functions-inner';

const tryImport = createImport(require);

// hot-reloading
if (!isCli && config.hotReloading) {
    app.models.watch();
    app.services.watch();
    app.locales.watch();

    // reload plugins
    app.plugins.watch().on("add", (filename: string) => {
        app.plugins.resolve(filename) && tryImport(filename);
    }).on("change", (filename: string) => {
        let name = app.plugins.resolve(filename);

        if (name) {
            // remove previous plugins from the internal container
            app.plugins.removeHandlers(name);
            tryImport(filename);
        }
    }).on("unlink", (filename: string) => {
        let name = app.plugins.resolve(filename);
        name && app.plugins.removeHandlers(name);
    });
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