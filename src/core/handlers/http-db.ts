import { DB } from "modelar";
import { app } from "../bootstrap/index";
import { config } from "../bootstrap/load-config";
import { Request, Response } from "../tools/interfaces";
import { realDB } from "../tools/symbols";

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
