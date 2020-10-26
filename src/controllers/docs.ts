import { route, HttpController, ROOT_PATH, Request, Response } from "sfn";
import { readdir } from 'fs-extra';
import trimEnd = require("lodash/trimEnd");

export default class extends HttpController {
    @route.get("/docs")
    @route.get("/docs/")
    async docs(req: Request, res: Response) {
        let folders = (await readdir(ROOT_PATH + "/docs")).sort((a, b) => {
            let ver1 = a.slice(1).replace(".", ".");
            let ver2 = b.slice(1).replace("_", ".");
            return parseFloat(ver2) - parseFloat(ver1);
        });
        let url = `/docs/${folders[0]}/getting-started`;

        if (req.query.lang)
            url += `?lang=${req.query.lang}`;

        return res.redirect(url);
    }

    @route.get("/docs/:version/:name")
    @app.hooks.web.onView.decorate()
    async showContents(req: Request, version: string, name: string) {
        return this.throttle(req.url + ":xhr:" + req.xhr, async () => {
            version = trimEnd(version, ".x").replace(/v0\.(\d)/, "v0_$1");

            if (["zh", "zh-hans"].includes(this.lang)) {
                this.lang = "zh-CN";
            }

            if (this.lang !== "zh-CN") {
                this.lang = "en-US";
            }

            let sideMenu = await app.services.docs.getSideMenu(version, this.lang);
            let content = await app.services.docs.getContent(version, this.lang, name);

            return req.xhr ? content : this.view("docs", { sideMenu, content });
        }, 1000);
    }
}
