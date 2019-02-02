import { route, HttpError, MarkdownParser, isDevMode, ROOT_PATH } from "sfn";
import HttpController from "./index";
import { readdir, readFile } from 'fs-extra';
import { resolve as resolvePath } from "path";
import { Section, constructMarkdown, renderHtml } from "outlining";
import trim = require("lodash/trim");
import meta from "comment-meta";

export default class DocController extends HttpController {
    @route.get("/docs")
    @route.get("/docs/")
    async docs() {
        let folders = (await readdir(ROOT_PATH + "/docs")).sort((a, b) => {
            return parseFloat(b.slice(1)) - parseFloat(a.slice(1));
        });
        let url = `/docs/${folders[0]}/getting-started`;

        if (this.req.query.lang)
            url += `?lang=${this.req.query.lang}`;

        return this.res.redirect(url);
    }

    @route.get("/docs/:version/:name")
    async showContents(version: string, name: string) {
        let lang = this.lang,
            dir = `${ROOT_PATH}/docs/${version}/${lang}`,
            ver = `[${version}][${lang}]`.replace(/\./g, ""),
            content: string = this.cache.get(`doc.contents[${ver}][${name}]`),
            sideMenu = this.cache.get(`doc.sideMenu[${ver}]`);

        try {
            if (isDevMode || !sideMenu) {
                let categoryTree = await this.getCategoryTree(version, lang, dir);
                sideMenu = renderHtml(categoryTree, "categories", "    ");
                this.cache.set(`doc.sideMenu[${ver}]`, sideMenu);
            }

            if (isDevMode || !content) {
                content = await readFile(resolvePath(dir, name + ".md"), "utf8");
                content = await MarkdownParser.parse(content);
                this.cache.set(`doc.contents[${ver}][${name}]`, content);
            }
        } catch (e) {
            let code = (<Error>e).message.includes("no such file") ? 404 : 500;
            throw new HttpError(code, e.message);
        }

        return this.req.xhr ? content : this.view("docs", {
            ...this.indexVars,
            sideMenu,
            content
        });
    }

    private async getCategoryTree(version: string, lang: string, dir: string) {
        let files = await readdir(dir),
            categoryTree: Array<{
                order: number;
                id: string;
                level: number;
                title: string;
                children: Section[]
            }> = [];

        for (let file of files) {
            let _name = file.slice(0, -3),
                content = await readFile(dir + "/" + file, "utf8"),
                metaData = meta(content)[0] || {};

            categoryTree.push({
                order: parseInt(metaData.order) || 0,
                id: _name,
                level: 0,
                title: `<a href="/docs/${version}/${_name}" title="${metaData.title}">${metaData.title}</a><i class="fa fa-angle-right"></i>`,
                children: constructMarkdown(content, section => {
                    let depth = section.id.split(".").length,
                        padding = depth <= 2 ? depth * 15 + 10 : 40,
                        title = section.title.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/`/g, ""),
                        isLatin = Buffer.byteLength(section.title) == section.title.length,
                        _text = section.title.replace(/\s/g, '-'),
                        re = /[~`!@#\$%\^&\*\(\)\+=\{\}\[\]\|:"'<>,\.\?\/]/g,
                        id: string;

                    if (isLatin) {
                        let matches = _text.match(/[\-0-9a-zA-Z]+/g);
                        id = matches ? matches.join("_") : _text.replace(re, "_");
                    } else {
                        id = _text.replace(re, "_");
                    }

                    id = trim(id, "_");

                    title = `<a href="/docs/${version}/${_name}#${id}" title="${title}"`
                        + ` style="padding-left: ${padding}px">${title}</a>`
                        + (section.children ? '<i class="fa fa-angle-right"></i>' : '');

                    return { title };
                })
            });
        }

        return categoryTree.sort((a, b) => a.order - b.order);
    }
}