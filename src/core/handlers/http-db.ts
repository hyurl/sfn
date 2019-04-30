import { DB } from "modelar";
import { router } from "../bootstrap/index";
import { Request, Response } from "../tools/interfaces";
import { realDB } from "../tools/symbols";

router.use(async (req: Request, res: Response, next) => {
    Object.defineProperty(req, "db", {
        get(): DB {
            if (req[realDB] === undefined) {
                req[realDB] = new DB(app.config.database);
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
