import { App } from "webium";
import { User } from "modelar";
import { Request, Response } from "../tools/interfaces";
import { User as UserClass } from "../bootstrap/UserLoader";

export function handleHttpAuth(app: App): void {
    app.use(async (req: Request, res: Response, next) => {
        req.user = null;
        if (req.session && req.session.uid) {
            try {
                req.user = <User>await UserClass.use(req.db).get(req.session.uid);
            } catch (e) { }
        }
        await next();
    });
}