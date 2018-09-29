"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const multer = require("multer");
const date = require("sfn-date");
const ideal_filename_1 = require("ideal-filename");
const function_intercepter_1 = require("function-intercepter");
const functions_1 = require("./functions");
const HttpController_1 = require("../controllers/HttpController");
function upload(...fields) {
    return function_intercepter_1.interceptAsync().before(function () {
        let _fileds = [], { req, res, uploadOptions: { maxCount = HttpController_1.UploadOptions.maxCount, savePath = HttpController_1.UploadOptions.savePath, filter = HttpController_1.UploadOptions.filter, filename = HttpController_1.UploadOptions.filename } } = this;
        if (req.method != "POST")
            return;
        savePath += "/" + date("Y-m-d");
        fields.forEach(name => _fileds.push({ name, maxCount }));
        return new Promise((resolve, reject) => {
            let handle = multer({
                storage: multer.diskStorage({
                    destination: (req, file, cb) => {
                        fs.ensureDir(savePath, err => {
                            cb(err, savePath);
                        });
                    },
                    filename: (req, file, cb) => {
                        try {
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
                        cb(null, filter(file));
                    }
                    catch (err) {
                        cb(err, false);
                    }
                }
            }).fields(_fileds);
            handle(req, res, (err) => {
                err ? reject(err) : resolve(void 0);
            });
        });
    });
}
exports.upload = upload;
//# sourceMappingURL=upload.js.map