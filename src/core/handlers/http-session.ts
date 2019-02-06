import * as ExpressSession from "express-session";
import { intercept } from "function-intercepter";
import { config } from "../bootstrap/load-config";
import { router } from "../bootstrap/index";
import { Response } from "../tools/interfaces";

type SessionHanlder = (req: any, res: any, next: Function) => void;

export var session = <SessionHanlder>ExpressSession(config.session);

router.use(session).use(async (req, res: Response, next) => {
    res.sent = false;
    res.end = intercept(res.end).before(() => {
        res.sent = true;
    });
    await next();
});