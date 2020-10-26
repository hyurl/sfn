import * as fs from "fs";
import { ModuleProxyApp, ModuleProxy } from "microse";
import { SRC_PATH } from '../../init';
import { View } from '../tools/interfaces';
import define from '@hyurl/utils/define';

declare global {
    namespace app {
        const views: ModuleProxyApp & { [x: string]: ModuleProxy<View>; };
    }
}

export const ViewEntry = new ModuleProxyApp("app.views", SRC_PATH + "/views");
define(app, "views", ViewEntry);

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
            };
        }

        return this.cache[file];
    },
    unload(file: string) {
        delete this.cache[file];
    }
});
