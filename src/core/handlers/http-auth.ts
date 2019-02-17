import { router } from "../bootstrap/index";
import { Request, Response } from "../tools/interfaces";
import { loadUser } from "../bootstrap/load-user";

router.use(async (req: Request, res: Response, next) => {
    req.user = null;
    if (req.session && req.session.uid) {
        try {
            req.user = <any>await loadUser().use(req.db).get(req.session.uid);
        } catch (e) { }
    }
    await next();
});
