import * as path from "path";
import * as fs from "fs-extra";
import * as multer from "multer";
import * as date from "sfn-date";
import idealFilename from "ideal-filename";
import { interceptAsync } from "function-intercepter";
import { randStr } from "./functions";
import { HttpDecorator } from "./interfaces";
import {
    HttpController,
    UploadingFile,
    UploadOptions
} from "../controllers/HttpController";

/** Allows the method accept file uploading with specified fields. */
export function upload(...fields: string[]): HttpDecorator {
    return interceptAsync<HttpController>().before(function () {
        let _fileds: Array<{ name: string, maxCount: number }> = [],
            {
                req,
                res,
                uploadOptions: {
                    maxCount = UploadOptions.maxCount,
                    savePath = UploadOptions.savePath,
                    filter = UploadOptions.filter,
                    filename = UploadOptions.filename
                }
            } = this;

        if (req.method != "POST") return;

        savePath += "/" + date("Y-m-d");
        fields.forEach(name => _fileds.push({ name, maxCount }));

        return new Promise<void>((resolve, reject) => {
            let handle = multer({
                storage: multer.diskStorage({
                    destination: (req, file, cb) => {
                        fs.ensureDir(savePath, err => {
                            cb(err, savePath);
                        });
                    },
                    filename: (req, file: UploadingFile, cb) => {
                        try {
                            if (typeof filename == "function") {
                                // The filename is customized by the user.
                                cb(null, filename(file));
                            } else if (filename === "random") {
                                // The filename will be a random string.
                                let extname = path.extname(file.originalname);
                                cb(null, randStr(32) + extname);
                            } else {
                                // auto-increment
                                let filename = `${savePath}/${file.originalname}`;
                                idealFilename(filename).then(filename => {
                                    cb(null, path.basename(filename));
                                }).catch(err => {
                                    cb(err, "");
                                });
                            }
                        } catch (err) {
                            cb(err, "");
                        }
                    }
                }),
                fileFilter: (req, file: UploadingFile, cb) => {
                    try {
                        cb(null, filter(file));
                    } catch (err) {
                        cb(err, false);
                    }
                }
            }).fields(_fileds);

            handle(<any>req, <any>res, (err: Error) => {
                err ? reject(err) : resolve(void 0);
            });
        });
    });
}