import * as alar from "alar";
import { SRC_PATH } from '../../init';
import { Locale } from '../tools/interfaces';
import { createImport, loadLanguagePack } from '../tools/internal/module';
import define from '@hyurl/utils/define';

declare global {
    namespace app {
        const locales: alar.ModuleProxy & {
            [x: string]: ModuleProxy<Locale> | object;
            translations: { [lang: string]: Locale };
        };
    }
}

define(app,
    "locales",
    new alar.ModuleProxy("app.locales", SRC_PATH + "/locales"));

const tryImport = createImport(require);
const _watch: () => alar.FSWatcher = app.locales.watch.bind(app.locales);

app.locales.setLoader({
    cache: {},
    extension: [".json", ".jsonc"],
    load(file: string) {
        return this.cache[file] || (this.cache[file] = tryImport(file));
    },
    unload(file: string) {
        delete this.cache[file];
    }
});

app.locales.watch = () => {
    return _watch().on("add", loadLanguagePack).on("change", loadLanguagePack);
}