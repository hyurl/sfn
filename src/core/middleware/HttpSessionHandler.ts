import { App } from "webium";
import { session, getHash } from "../bootstrap/session";
import { Request, Response } from "../tools/interfaces";

export function handleHttpSession(app: App) {
    app.use((req: Request, res: Response, next) => {
        // express-session change the `res.end()` method that appears to be 
        // having a bug which will delay changing the `res.finished` property,
        // the following code will trying to fix that.
        session(req, {}, (err) => {
            if (err) throw err;

            let hash = getHash(req.session),
                handler = () => {
                    if (hash !== getHash(req.session)) {
                        req.session.touch(null);
                        req.session.save(err => {
                            if (err) throw err;
                        });
                    }
                };

            res.on("finish", handler).on("close", handler);

            next();
        });
    });
}