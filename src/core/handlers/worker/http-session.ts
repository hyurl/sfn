import * as ExpressSession from "express-session";
import { intercept } from "function-intercepter";
import { config } from "../../bootstrap/ConfigLoader";
import { app } from "../../bootstrap/index";
import { Response } from "../../tools/interfaces";

type SessionHanlder = (req: any, res: any, next: Function) => void;

export var session = <SessionHanlder>ExpressSession(config.session);

app.use(session).use((req, res: Response, next) => {
    res.sent = false;
    res.end = intercept(res.end).before(() => {
        res.sent = true;
    });
    next();
});