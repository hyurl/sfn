import * as BodyParser from "body-parser";
import { Builder, parseString, OptionsV2 } from "xml2js";
import { promisify } from "util";
import { router } from "../bootstrap/index";
import { Request, Response } from "../tools/interfaces";
import * as FRON from "fron";

const parseXML = promisify<any, OptionsV2, any>(<any>parseString);
const plainType = /text\/plain\b/;
const xmlType = /(text|application)\/xml\b/;
const fronType = /(text|application)\/(javascript|jsonc|fron)\b/;

router.use(<any>BodyParser.text({
    type: (req) => {
        // Parse request body as plain text.
        let type = req.headers['content-type'];
        return plainType.test(type)
            || xmlType.test(type)
            || fronType.test(type);
    }
})).use(async (req: Request, res: Response, next) => {
    res.xml = xml;

    if (!req.type)
        return next();

    // Parse XML request body.
    let [prefix, type] = req.type.split("/");

    if (prefix === "text" || prefix === "application") {
        switch (type) {
            case "xml":
                try {
                    req.body = await parseXML(req.body, {
                        async: true,
                        explicitArray: false,
                        explicitRoot: false
                    });
                } catch (e) {
                    req.body = null;
                }
                break;

            case "javascript":
            case "jsonc":
            case "fron":
                try {
                    req.body = await FRON.parseAsync(req.body);
                } catch (e) {
                    req.body = null;
                }
                break;
        }
    }

    await next();
});

function xml(
    this: Response,
    data: { [key: string]: any },
    rootTag = "root",
    headless = false
): void {
    this.type = "application/xml";

    if (data === null || data === undefined)
        return this.end();

    let builder = new Builder({
        cdata: true,
        rootName: rootTag,
        headless
    });

    this.send(builder.buildObject(data));
}