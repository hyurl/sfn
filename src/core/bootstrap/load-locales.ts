import { ModuleProxyApp, ModuleProxy, FSWatcher } from "microse";
import { SRC_PATH } from '../../init';
import { Locale } from '../tools/interfaces';
import { createImport, loadLanguagePack } from '../tools/internal/module';
import define from '@hyurl/utils/define';

declare global {
    namespace app {
        const locales: ModuleProxyApp & {
            [x: string]: ModuleProxy<Locale> | object;
            translations: { [lang: string]: Locale };
        };
    }
}

define(app,
    "locales",
    new ModuleProxyApp("app.locales", SRC_PATH + "/locales"));
define(app.locales, "translations", {});

const tryImport = createImport(require);
const _watch: () => FSWatcher = app.locales.watch.bind(app.locales);

app.locales.setLoader({
    cache: {},
    extension: [".json", ".jsonc"],
    load(file: string) {
        return this.cache[file] ||= tryImport(file);
    },
    unload(file: string) {
        delete this.cache[file];
    }
});

app.locales.watch = () => {
    return _watch().on("add", loadLanguagePack).on("change", loadLanguagePack);
}
