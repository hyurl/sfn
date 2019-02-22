import * as fs from "fs";
import * as alar from "alar";
import { SRC_PATH } from '../../init';
import { View } from '../tools/interfaces';

declare global {
    namespace app {
        const views: alar.ModuleProxy & { [x: string]: ModuleProxy<View> };
    }
}

global["app"].views = new alar.ModuleProxy("views", SRC_PATH + "/views");

app.views.setLoader({
    cache: {},
    extesion: ".html",
    load(path: string) {
        if (!this.cache[path]) {
            let contents = fs.readFileSync(path + this.extesion, "utf8");
            this.cache[path] = {
                render: () => {
                    return contents;
                }
            }
        }

        return this.cache[path];
    },
    unload(path: string) {
        delete this.cache[path];
    }
});