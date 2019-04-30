import { isCli } from '../../init';
import { createImport } from '../tools/internal/module';

const tryImport = createImport(require);

// hot-reloading
app.plugins.lifeCycle.startup.bind(() => {
    if (!isCli && app.config.hotReloading) {
        app.services.watch();
        app.models.watch();
        app.utils.watch();
        app.locales.watch();
        app.plugins.watch();
    }
});

export function watchWebModules() {
    if (!isCli && app.config.hotReloading) {
        app.views.watch();

        // hot-reload controllers
        let autoLoad = (filename: string) => {
            app.controllers.resolve(filename) && tryImport(filename);
        };

        app.controllers.watch().on("add", autoLoad).on("change", autoLoad);
    }
}