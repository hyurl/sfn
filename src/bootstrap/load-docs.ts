import * as alar from "alar";
import * as fs from "fs";
import { View } from "sfn";
import startsWith = require('lodash/startsWith');
import get = require('lodash/get');

declare global {
    namespace app {
        const docs: alar.ModuleProxy & { [name: string]: ModuleProxy<View> };
    }
}

// add new module proxy to auto-load and hot-reload markdown documentations
global.app.docs = new alar.ModuleProxy("app.docs", app.ROOT_PATH + "/docs");

app.docs.setLoader({
    cache: {},
    extension: ".md",
    load(file) {
        if (!this.cache[file]) {
            let contents = fs.readFileSync(file, "utf8");
            let markdown = app.utils.markdown.create();

            contents = markdown.parse(contents);
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


// Rewrite watch method for more advanced functions.
const _watch: () => alar.FSWatcher = app.docs.watch.bind(app.docs);
app.docs.watch = () => {
    return _watch().on("change", reload).on("unlink", reload);
};


function reload(file: string) {
    let parts = file.slice(app.docs.path.length + 1).split(/\\|\//);
    let lang = parts[1];

    if (startsWith(app.id, "doc-server")
        || !app.rpc.hasConnect("doc-server")
    ) {
        let path = `app.docs.sideMenu.${parts[0]}.${lang}`;

        app.services.cache().delete(path);
    }

    if (startsWith(app.id, "web-server")) {
        // Use WebSocket to reload the web page.
        let name = app.docs.resolve(file);
        let data = (<ModuleProxy<View>>get(global, name)).instance(file).render();
        let pathname = `/docs/${parts[0]}/${parts.slice(2).join("/").slice(0, -3)}`;

        app.message.ws.local.emit("renew-doc-contents", pathname, lang, data);
    }
}