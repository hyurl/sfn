import * as ExpressSession from "express-session";
import { config } from "../../bootstrap/ConfigLoader";
import { app } from "../../bootstrap/index";
import { Response } from "../../tools/interfaces";

type SessionHanlder = (req: any, res: any, next: Function) => void;

export var session = <SessionHanlder>ExpressSession(config.session);

app.use(session).use((req, res: Response, next) => {
    let _end = res.end;
    res.end = function end(...args) {
        res.sent = true;

        // HTTP/2 disallow setting these headers.
        if (req.httpVersion == "2.0") {
            res.statusMessage = "";
            res.removeHeader("connection");
        }

        _end.apply(res, args);
    }
    next();
});