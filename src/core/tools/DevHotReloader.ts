import * as fs from "fs";
import * as path from "path";

export class DevHotReloader {
    readonly watcher: fs.FSWatcher;

    constructor(dirname: string, extnames = [".js", ".json"]) {
        this.watcher = fs.watch(dirname, {
            recursive: true,
        }, (event, filename) => {
            let basename = path.basename(dirname),
                ext = path.extname(filename);

            if (event === "change" && extnames.includes(ext)) {
                if (basename == filename) {
                    filename = dirname;
                } else {
                    filename = path.resolve(dirname, filename);
                }

                if (require.cache[filename]) {
                    // reload the script
                    delete require.cache[filename];
                    require(filename);
                }
            }
        });
    }

    close(): void {
        this.watcher.close();
    }
}