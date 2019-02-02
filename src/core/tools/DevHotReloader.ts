import * as chokidar from "chokidar";
import * as path from "path";
import startsWith = require("lodash/startsWith");

export class DevHotReloader {
    readonly watcher: chokidar.FSWatcher;

    constructor(dirname: string, extnames = [".ts", ".js", ".json"]) {
        this.watcher = DevHotReloader.watchers[dirname] = chokidar.watch(dirname, {
            awaitWriteFinish: true,
            followSymlinks: false
        });

        this.watcher.on("add", filename => {
            let ext = path.extname(filename);
            if (extnames.includes(ext)) {
                require(filename);
            }
        }).on("change", filename => {
            if (require.cache[filename]) {
                delete require.cache[filename];
                require(filename);
            }
        }).on("unlink", filename => {
            if (require.cache[filename])
                delete require.cache[filename];
        }).on("unlinkDir", dirname => {
            dirname = dirname + path.sep;
            for (let filename in require.cache) {
                if (startsWith(filename, dirname))
                    delete require.cache[filename];
            }
        });
    }

    close(): void {
        this.watcher.close();
    }
}

export namespace DevHotReloader {
    export const watchers: { [dirname: string]: chokidar.FSWatcher } = {};
}