import { route, HttpController, ROOT_PATH, Request, Response } from "sfn";
import { readdir } from 'fs-extra';
import DocumentationService from "../services/docs";

export default class extends HttpController {
    @app.services.docs.inject()
    protected docSrv: DocumentationService;

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
    @app.hooks.web.onView.decorate()
    async showContents(req: Request, version: string, name: string) {
        let sideMenu = await this.docSrv.getSideMenu(version, this.lang);
        let content = await this.docSrv.getContent(version, this.lang, name);

        return req.xhr ? content : this.view("docs", { sideMenu, content });
    }
}