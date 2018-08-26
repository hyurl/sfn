import { App } from "webium";
import * as ExpressSession from "express-session";
import { config } from "../bootstrap/ConfigLoader";
import { Response } from "../tools/interfaces";

type SessionHanlder = (req: any, res: any, next: Function) => void;

export var session = <SessionHanlder>ExpressSession(config.session);

export function handleHttpSession(app: App) {
    app.use(session).use((req, res: Response, next) => {
        let _end = res.end;
        res.end = function end(...args) {
            res.sent = true;
            _end.apply(res, args);
        }
        next();
    });
}