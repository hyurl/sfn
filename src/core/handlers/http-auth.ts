import { router } from "../bootstrap/index";
import { Request, Response } from "../tools/interfaces";
import { importUser } from "../tools/internal/module";

router.use(async (req: Request, res: Response, next) => {
    req.user = null;
    if (req.session && req.session.uid) {
        try {
            req.user = <any>await importUser().use(req.db).get(req.session.uid);
        } catch (e) { }
    }
    await next();
});
