import * as fs from "fs";
import * as alar from "alar";
import { SRC_PATH } from '../../init';
import { View } from '../tools/interfaces';

declare global {
    namespace app {
        const views: alar.ModuleProxy & { [x: string]: ModuleProxy<View> };
    }
}

global["app"].views = new alar.ModuleProxy("app.views", SRC_PATH + "/views");

app.views.setLoader({
    cache: {},
    extension: ".html",
    load(file: string) {
        if (!this.cache[file]) {
            let contents = fs.readFileSync(file, "utf8");
            this.cache[file] = {
                render: () => {
                    return contents;
                }
            }
        }

        return this.cache[file];
    },
    unload(file: string) {
        delete this.cache[file];
    }
});