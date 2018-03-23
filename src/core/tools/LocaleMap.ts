import * as fs from "fs";
import * as path from "path";
import { APP_PATH, SRC_PATH } from "../../init";
import { Locale } from "../tools/interfaces";
import { loadLanguagePack } from "../tools/functions-inner";

export const LocaleMap: {
    [name: string]: Locale
} = {};

function loadLocales(dir: string): void {
    if (fs.existsSync(dir)) {
        let files = fs.readdirSync(dir);
        for (let file of files) {
            let ext = path.extname(file);

            if (ext == ".js" || ext == ".json") {
                let name = path.basename(file, ext).toLowerCase(),
                    lang = loadLanguagePack(dir + "/" + file);
                LocaleMap[name] = lang;
            }
        }
    }
}

loadLocales(SRC_PATH + "/locales");

if (SRC_PATH !== APP_PATH) {
    loadLocales(APP_PATH + "/locales");
}