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

global.app.locales = new alar.ModuleProxy("app.locales", SRC_PATH + "/locales");

app.locales.setLoader({
    cache: {},
    extension: ".json",
    load(file: string) {
        if (!this.cache[file]) {
            try {
                this.cache[file] = FRON.parse(fs.readFileSync(file, "utf8"), file);
            } catch (e) {
                this.cache[file] = {};
            }
        }

        return this.cache[file];
    },
    unload(file: string) {
        delete this.cache[file];
    }
});