import * as fs from "fs";
import * as path from "path";
import { APP_PATH, isTsNode } from "../../init";
import { Locale } from "../tools/interfaces";
import { loadLanguagePack } from "../tools/functions-inner";

export const LocaleMap: {
    [name: string]: Locale
} = {};

const Ext = isTsNode ? ".ts" : ".js";

function loadLocales(dir: string): void {
    if (fs.existsSync(dir)) {
        let files = fs.readdirSync(dir);
        for (let file of files) {
            let ext = path.extname(file);

            if (ext == Ext || ext == ".json") {
                let name = path.basename(file, ext).toLowerCase(),
                    lang = loadLanguagePack(dir + "/" + file);

                LocaleMap[name] = lang;
            }
        }
    }
}

loadLocales(APP_PATH + "/locales");