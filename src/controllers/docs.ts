import { route, HttpController, ROOT_PATH, Request, Response } from "sfn";
import { readdir } from 'fs-extra';

export default class extends HttpController {
    private async getLatestVersion() {
        let folders = (await readdir(ROOT_PATH + "/docs")).sort((a, b) => {
            let ver1 = a.slice(1).replace(".", ".");
            let ver2 = b.slice(1).replace("_", ".");
            return parseFloat(ver2) - parseFloat(ver1);
        });

        return folders[0];
    }

    @route.get("/docs")
    @route.get("/docs/")
    async docs(req: Request, res: Response) {
        let ver = await this.getLatestVersion();
        let url = `/docs/${ver}/getting-started`;

        if (req.query.lang)
            url += `?lang=${req.query.lang}`;

        return res.redirect(url);
    }

    @route.get("/docs/:version/:name")
    @app.hooks.web.onView.decorate()
    async showContents(req: Request, version: string, name: string) {
        return this.throttle(req.url + ":xhr:" + req.xhr, async () => {
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

    @route.get("/api")
    @route.get("/api/")
    async api(req: Request, res: Response) {
        let ver = await this.getLatestVersion();
        let url = `/api/${ver}/Service`;

        if (req.query.lang)
            url += `?lang=${req.query.lang}`;

        return res.redirect(url);
    }

    @route.get("/api/:version/:name")
    @app.hooks.web.onView.decorate()
    async showApiContents(req: Request, version: string, name: string) {
        return this.throttle(req.url + ":xhr:" + req.xhr, async () => {
            let sideMenu = await app.services.docs.getSideMenu(version, "api");
            let content = await app.services.docs.getContent(version, "api", `${name}`);

            return req.xhr ? content : this.view("docs", { sideMenu, content });
        });
    }
}
