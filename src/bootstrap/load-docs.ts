import * as alar from "alar";
import * as fs from "fs";
import { View } from "sfn";

declare global {
    namespace app {
        const docs: alar.ModuleProxy & { [name: string]: ModuleProxy<View> };
    }
}

// add new module proxy to auto-load and hot-reload markdown documentations
global["app"].docs = new alar.ModuleProxy("app.docs", app.ROOT_PATH + "/docs");

app.docs.setLoader({
    cache: {},
    extension: ".md",
    load(file) {
        if (!this.cache[file]) {
            let contents = fs.readFileSync(file, "utf8");

            contents = app.utils.markdown.instance().parse(contents);
            this.cache[file] = {
                render: () => {
                    return contents;
                }
            }
        }

        return this.cache[file];
    },
    unload(file) {
        delete this.cache[file];
    }
});

if (app.config.hotReloading) {
    let renewSideMenu = (file: string) => {
        let parts = file.slice(app.docs.path.length + 1).split(/\\|\//);
        let path = `app.docs.sideMenu.${parts[0]}.${parts[1]}`;

        app.services.base.instance().cache.delete(path)
    };
    app.docs.watch().on("change", renewSideMenu).on("unlink", renewSideMenu);
}