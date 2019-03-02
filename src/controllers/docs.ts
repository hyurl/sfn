import { route, HttpController, HttpError, ROOT_PATH, Request, Response, isDevMode } from "sfn";
import { readdir } from 'fs-extra';

export default class extends HttpController {
    @route.get("/docs")
    @route.get("/docs/")
    async docs(req: Request, res: Response) {
        let folders = (await readdir(ROOT_PATH + "/docs")).sort((a, b) => {
            return parseFloat(b.slice(1)) - parseFloat(a.slice(1));
        });
        let url = `/docs/${folders[0]}/getting-started`;

        if (req.query.lang)
            url += `?lang=${req.query.lang}`;

        return res.redirect(url);
    }

    @route.get("/docs/:version/:name")
    @app.plugins.web.onView.decorate()
    async showContents(req: Request, version: string, name: string) {
        try {
            let sideMenu = await app.services.docs.instance().getSideMenu(version, this.lang);
            let content = await app.services.docs.instance().getContent(version, this.lang, name);

            return req.xhr ? content : this.view("docs", { sideMenu, content });
        } catch (e) {
            let code = (<Error>e).message.includes("no such file") ? 404 : 500;
            throw new HttpError(code, isDevMode ? e.message : null);
        }
    }
}