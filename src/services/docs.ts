import { Service, ROOT_PATH, View, StatusException, isDevMode } from "sfn";
import { readdir, readFile } from 'fs-extra';
import { resolve as resolvePath } from "path";
import { Section, constructMarkdown, renderHtml } from "outlining";
import trim = require("lodash/trim");
import get = require("lodash/get");
import meta from "comment-meta";

declare global {
    namespace app {
        namespace services {
            const docs: ModuleProxy<DocumentationService>
        }
    }
}

export default class DocumentationService extends Service {
    async getSideMenu(version: string, lang: string) {
        let path = `app.docs.sideMenu.${version.replace(/\./g, "")}.${lang}`;
        let sideMenu: string = await app.services.cache().get(path);

        if (!sideMenu) {
            let categoryTree = await this.getCategoryTree(version, lang);
            sideMenu = renderHtml(categoryTree, "categories", "    ");
            await app.services.cache().set(path, sideMenu);
        }

        return sideMenu;
    }

    async getContent(version: string, lang: string, name: string) {
        let dir = `${ROOT_PATH}/docs/${version.replace(/\./g, "")}/${lang}`;
        let filename = resolvePath(dir, name + ".md");

        try {
            return (<ModuleProxy<View>>get(global, app.docs.resolve(filename)))
                .instance(filename)
                .render();
        } catch (e) {
            let code = (<Error>e).message.includes("no such file") ? 404 : 500;
            throw new StatusException(code, isDevMode ? e.message : null);
        }
    }

    async getCategoryTree(version: string, lang: string) {
        let dir = `${ROOT_PATH}/docs/${version.replace(/\./g, "")}/${lang}`;
        let files = await readdir(dir);
        let categoryTree: Array<{
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
                order: parseFloat(metaData.order) || 0,
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