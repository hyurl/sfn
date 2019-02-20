import { HttpController, route, version, isDevMode } from "sfn";

declare global {
    namespace app {
        namespace controllers {
            const index: ModuleProxy<IndexController>;
        }
    }
}

/**
 * The Home controller is a special controller, it handles requests which 
 * visit the home page of the website through `GET /`.
 */
export default class IndexController extends HttpController {
    isZh = this.lang.includes("zh");
    indexVars = {
        anotherLang: this.isZh ? "en-US" : "zh-CN",
        changeLang: this.isZh ? "English (US)" : "中文 (简体)",
        version
    };

    @route.get("/")
    async index() {
        let ver = this.isZh ? "index.zh" : "index.en";

        return !isDevMode && this.cache.get(ver) || this.cache.set(
            ver,
            await this.view(ver, this.indexVars)
        );
    }
}