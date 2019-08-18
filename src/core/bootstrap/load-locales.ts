import * as alar from "alar";
import { SRC_PATH } from '../../init';
import { Locale } from '../tools/interfaces';
import { createImport } from '../tools/internal/module';

declare global {
    namespace app {
        const locales: alar.ModuleProxy & { [x: string]: ModuleProxy<Locale> };
    }
}

global.app.locales = new alar.ModuleProxy("app.locales", SRC_PATH + "/locales");

const tryImport = createImport(require);

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