"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sfn_1 = require("sfn");
const index_1 = require("./index");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const outlining_1 = require("outlining");
const trim = require("lodash/trim");
const comment_meta_1 = require("comment-meta");
class DocController extends index_1.default {
    async docs() {
        let folders = (await fs_extra_1.readdir(sfn_1.ROOT_PATH + "/docs")).sort((a, b) => {
            return parseFloat(b.slice(1)) - parseFloat(a.slice(1));
        });
        let url = `/docs/${folders[0]}/getting-started`;
        if (this.req.query.lang)
            url += `?lang=${this.req.query.lang}`;
        return this.res.redirect(url);
    }
    async showContents(version, name) {
        let lang = this.lang, dir = `${sfn_1.ROOT_PATH}/docs/${version}/${lang}`, ver = `[${version}][${lang}]`.replace(/\./g, ""), content = this.cache.get(`doc.contents[${ver}][${name}]`), sideMenu = this.cache.get(`doc.sideMenu[${ver}]`);
        try {
            if (sfn_1.isDevMode || !sideMenu) {
                let categoryTree = await this.getCategoryTree(version, lang, dir);
                sideMenu = outlining_1.renderHtml(categoryTree, "categories", "    ");
                this.cache.set(`doc.sideMenu[${ver}]`, sideMenu);
            }
            if (sfn_1.isDevMode || !content) {
                content = await fs_extra_1.readFile(path_1.resolve(dir, name + ".md"), "utf8");
                content = await sfn_1.MarkdownParser.parse(content);
                this.cache.set(`doc.contents[${ver}][${name}]`, content);
            }
        }
        catch (e) {
            let code = e.message.includes("no such file") ? 404 : 500;
            throw new sfn_1.HttpError(code, e.message);
        }
        return this.req.xhr ? content : this.view("docs", Object.assign({}, this.indexVars, { sideMenu,
            content }));
    }
    async getCategoryTree(version, lang, dir) {
        let files = await fs_extra_1.readdir(dir), categoryTree = [];
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
tslib_1.__decorate([
    sfn_1.route.get("/docs"),
    sfn_1.route.get("/docs/"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], DocController.prototype, "docs", null);
tslib_1.__decorate([
    sfn_1.route.get("/docs/:version/:name"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String]),
    tslib_1.__metadata("design:returntype", Promise)
], DocController.prototype, "showContents", null);
exports.default = DocController;
//# sourceMappingURL=docs.js.map