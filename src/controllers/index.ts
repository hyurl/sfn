import { HttpController, route, version } from "sfn";

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
        return this.view("index", this.indexVars);
    }
}