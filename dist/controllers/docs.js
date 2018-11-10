"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sfn_1 = require("sfn");
const index_1 = require("./index");
const fs_extra_1 = require("fs-extra");
const outlining_1 = require("outlining");
const trim = require("lodash/trim");
const comment_meta_1 = require("comment-meta");
let fileContents = {};
let sideMenu = {};
class DocController extends index_1.default {
    docs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let folders = (yield fs_extra_1.readdir(sfn_1.ROOT_PATH + "/docs")).sort((a, b) => {
                return parseFloat(b.slice(1)) - parseFloat(a.slice(1));
            });
            let url = `/docs/${folders[0]}/getting-started`;
            if (this.req.query.lang)
                url += `?lang=${this.req.query.lang}`;
            return this.res.redirect(url);
        });
    }
    showContents(version, name) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let lang = this.lang, dir = `${sfn_1.ROOT_PATH}/docs/${version}/${lang}`, content;
            if (fileContents[lang] === undefined)
                fileContents[lang] = {};
            try {
                if (sfn_1.isDevMode || !sideMenu[lang]) {
                    let files = yield fs_extra_1.readdir(dir), categoryTree = [];
                    for (let file of files) {
                        let _name = file.slice(0, -3), content = yield fs_extra_1.readFile(dir + "/" + file, "utf8"), metadata = comment_meta_1.default(content)[0] || {};
                        fileContents[lang][_name] = content;
                        categoryTree.push({
                            order: parseInt(metadata.order) || 0,
                            id: _name,
                            level: 0,
                            title: `<a href="/docs/${version}/${_name}" title="${metadata.title}">${metadata.title}</a><i class="fa fa-angle-right"></i>`,
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
                    categoryTree = categoryTree.sort((a, b) => a.order - b.order);
                    sideMenu[lang] = outlining_1.renderHtml(categoryTree, "categories", "    ");
                }
                if (!fileContents[lang][name])
                    throw new sfn_1.HttpError(404, "no such file");
                content = yield sfn_1.MarkdownParser.parse(fileContents[lang][name]);
            }
            catch (e) {
                if (e instanceof sfn_1.HttpError) {
                    throw e;
                }
                else {
                    let code = e.message.includes("no such file") ? 404 : 500;
                    throw new sfn_1.HttpError(code, e.message);
                }
            }
            return this.req.xhr ? content : this.view("docs", Object.assign({}, this.indexVars, { sideMenu: sideMenu[lang], content }));
        });
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