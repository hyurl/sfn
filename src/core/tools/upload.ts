import * as path from "path";
import * as fs from "fs-extra";
import * as multer from "multer";
import * as moment from "moment";
import idealFilename from "ideal-filename";
import randStr from "@hyurl/utils/randStr";
import { interceptAsync } from "function-intercepter";
import { ROOT_PATH } from "../../init";
import { HttpDecorator } from "./interfaces";
import { HttpController } from "../controllers/HttpController";

export type UploadOptions = {
    /** Maximum number of files that each form field can carry. */
    maxCount?: number;
    /** A path in the disk that stores the uploaded files. */
    savePath?: string;
    /** Returns `true` to accept, `false` to reject. */
    filter?: (file: UploadingFile) => boolean;
    /** `auto-increment`, `random` or a function returns the filename. */
    filename?: "auto-increment" | "random" | ((file: UploadingFile) => string);
};

export const UploadOptions: UploadOptions = {
    maxCount: 1,
    savePath: ROOT_PATH + "/uploads",
    filter: (file) => !!file,
    filename: "auto-increment"
};

export interface UploadingFile {
    /** Field name specified in the form. */
    fieldname: string;
    /** Name of the file on the user's computer. */
    originalname: string;
    /** Encoding type of the file. */
    encoding: string;
    /** Mime type of the file. */
    mimetype: string;
}

export interface UploadedFile extends UploadingFile {
    /** The folder to which the file has been saved. */
    destination: string;
    /** The name of the file within the destination. */
    filename: string;
    /** Location of the uploaded file. */
    path: string;
    /** Size of the file in bytes. */
    size: number;
}

/** Allows the method accept file uploading with specified options. */
export function upload(options: { [field: string]: UploadOptions }): HttpDecorator;
/** Allows the method accept file uploading with specified fields. */
export function upload(...fields: string[]): HttpDecorator;
export function upload(...args): HttpDecorator {
    return interceptAsync().before(function (this: HttpController) {
        let fields: Array<{ name: string, maxCount: number }> = [],
            options: { [field: string]: UploadOptions } = {},
            { req, res } = this;

        if (req.method != "POST") return;

        if (typeof args[0] == "object") {
            options = Object.assign(options, args[0]);
        } else {
            for (let field of args) {
                options[field] = {};
            }
        }

        for (let x in options) {
            Object.assign(options[x], UploadOptions, this.uploadOptions);
            options[x].savePath += "/" + moment().format("YYYY-MM-DD");
            fields.push({ name: x, maxCount: options[x].maxCount });
        }

        return new Promise<void>((resolve, reject) => {
            let handle = multer({
                storage: multer.diskStorage({
                    destination: (req, file, cb) => {
                        let { savePath } = options[file.fieldname];
                        fs.ensureDir(savePath, {}, err => {
                            cb(err, savePath);
                        });
                    },
                    filename: (req, file: UploadingFile, cb) => {
                        try {
                            let { filename, savePath } = options[file.fieldname];
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
                        cb(null, options[file.fieldname].filter(file));
                    } catch (err) {
                        cb(err, false);
                    }
                }
            }).fields(fields);

            handle(<any>req, <any>res, (err: Error) => {
                err ? reject(err) : resolve(void 0);
            });
        });
    });
}