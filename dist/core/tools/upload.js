"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const multer = require("multer");
const date = require("sfn-date");
const ideal_filename_1 = require("ideal-filename");
const function_intercepter_1 = require("function-intercepter");
const init_1 = require("../../init");
const functions_1 = require("./functions");
exports.UploadOptions = {
    maxCount: 1,
    savePath: init_1.ROOT_PATH + "/uploads",
    filter: (file) => !!file,
    filename: "auto-increment"
};
function upload(...args) {
    return function_intercepter_1.interceptAsync().before(function () {
        let fields = [], options = {}, { req, res } = this;
        if (req.method != "POST")
            return;
        if (typeof args[0] == "object") {
            options = Object.assign(options, args[0]);
        }
        else {
            for (let field of args) {
                options[field] = {};
            }
        }
        for (let x in options) {
            Object.assign(options[x], exports.UploadOptions, this.uploadOptions);
            options[x].savePath += "/" + date("Y-m-d");
            fields.push({ name: x, maxCount: options[x].maxCount });
        }
        return new Promise((resolve, reject) => {
            let handle = multer({
                storage: multer.diskStorage({
                    destination: (req, file, cb) => {
                        let { savePath } = options[file.fieldname];
                        fs.ensureDir(savePath, err => {
                            cb(err, savePath);
                        });
                    },
                    filename: (req, file, cb) => {
                        try {
                            let { filename, savePath } = options[file.fieldname];
                            if (typeof filename == "function") {
                                cb(null, filename(file));
                            }
                            else if (filename === "random") {
                                let extname = path.extname(file.originalname);
                                cb(null, functions_1.randStr(32) + extname);
                            }
                            else {
                                let filename = `${savePath}/${file.originalname}`;
                                ideal_filename_1.default(filename).then(filename => {
                                    cb(null, path.basename(filename));
                                }).catch(err => {
                                    cb(err, "");
                                });
                            }
                        }
                        catch (err) {
                            cb(err, "");
                        }
                    }
                }),
                fileFilter: (req, file, cb) => {
                    try {
                        cb(null, options[file.fieldname].filter(file));
                    }
                    catch (err) {
                        cb(err, false);
                    }
                }
            }).fields(fields);
            handle(req, res, (err) => {
                err ? reject(err) : resolve(void 0);
            });
        });
    });
}
exports.upload = upload;
//# sourceMappingURL=upload.js.map