import { App } from "webium";
import { DB } from "modelar";
import { config } from "../../init";
import { Request, Response } from "../tools/interfaces";
import { realDB } from "../tools/symbols";

export function handleHttpDB(app: App): void {
    app.use(async (req: Request, res: Response, next) => {
        Object.defineProperty(req, "db", {
            get(): DB {
                if (req[realDB] === undefined) {
                    req[realDB] = new DB(config.database);
                }
                return req[realDB];
            },
            set(v: DB) {
                req[realDB] = v;
            }
        });

        let handler = () => {
            if (req[realDB])
                req[realDB].release();
        };

        res.on("finish", handler).on("close", handler);

        await next();
    });
}