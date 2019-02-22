import * as fs from "fs";
import * as alar from "alar";
import * as FRON from "fron";
import { SRC_PATH } from '../../init';
import { Locale } from '../tools/interfaces';

declare global {
    namespace app {
        const locales: alar.ModuleProxy & { [x: string]: ModuleProxy<Locale> };
    }
}

global["app"].locales = new alar.ModuleProxy("locales", SRC_PATH + "/locales");

app.locales.setLoader({
    cache: {},
    extesion: ".json",
    load(path: string) {
        if (!this.cache[path]) {
            let file = path + this.extesion;
            this.cache[path] = FRON.parse(fs.readFileSync(file, "utf8"), file);
        }

        return this.cache[path];
    },
    unload(path: string) {
        delete this.cache[path];
    }
});