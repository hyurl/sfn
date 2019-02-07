"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sfn_1 = require("sfn");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const outlining_1 = require("outlining");
const trim = require("lodash/trim");
const comment_meta_1 = require("comment-meta");
class DocumentationService extends sfn_1.Service {
    async getSideMenu(version, lang) {
        let ver = `[${version}][${lang}]`.replace(/\./g, "");
        let sideMenu = this.cache.get(`doc.sideMenu[${ver}]`);
        if (sfn_1.isDevMode || !sideMenu) {
            let categoryTree = await this.getCategoryTree(version, lang);
            sideMenu = outlining_1.renderHtml(categoryTree, "categories", "    ");
            this.cache.set(`doc.sideMenu[${ver}]`, sideMenu);
        }
        return sideMenu;
    }
    async getContent(version, lang, name) {
        let ver = `[${version}][${lang}]`.replace(/\./g, "");
        let dir = `${sfn_1.ROOT_PATH}/docs/${version}/${lang}`;
        let content = this.cache.get(`doc.contents[${ver}][${name}]`);
        if (sfn_1.isDevMode || !content) {
            content = await fs_extra_1.readFile(path_1.resolve(dir, name + ".md"), "utf8");
            content = await sfn_1.MarkdownParser.parse(content);
            this.cache.set(`doc.contents[${ver}][${name}]`, content);
        }
        return content;
    }
    async getCategoryTree(version, lang) {
        let dir = `${sfn_1.ROOT_PATH}/docs/${version}/${lang}`;
        let files = await fs_extra_1.readdir(dir);
        let categoryTree = [];
        for (let file of files) {
            let _name = file.slice(0, -3), content = await fs_extra_1.readFile(dir + "/" + file, "utf8"), metaData = comment_meta_1.default(content)[0] || {};
            categoryTree.push({
                order: parseInt(metaData.order) || 0,
                id: _name,
                level: 0,
                title: `<a href="/docs/${version}/${_name}" title="${metaData.title}">${metaData.title}</a><i class="fa fa-angle-right"></i>`,
                children: outlining_1.constructMarkdown(content, section => {
                    let depth = section.id.split(".").length, padding = depth <= 2 ? depth * 15 + 10 : 40, title = section.title.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/`/g, ""), isLatin = Buffer.byteLength(section.title) == section.title.length, _text = section.title.replace(/\s/g, '-'), re = /[~`!@#\$%\^&\*\(\)\+=\{\}\[\]\|:"'<>,\.\?\/]/g, id;
                    if (isLatin) {
                        let matches = _text.match(/[\-0-9a-zA-Z]+/g);
                        id = matches ? matches.join("_") : _text.replace(re, "_");
                    }
                    else {
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
exports.default = DocumentationService;
//# sourceMappingURL=docs.js.map