import * as BodyParser from "body-parser";
import { Builder, parseString, OptionsV2 } from "xml2js";
import { IncomingMessage } from "http";
import { promisify } from "util";
import { router } from "../bootstrap/index";
import { Request, Response } from "../tools/interfaces";

const plainType = /text\/plain\b/;
const xmlType = /(text|application)\/xml\b/;
const parseStringAsync = promisify<any, OptionsV2, any>(<any>parseString);

router.use(<any>BodyParser.text({
    type: parsingType
})).use(async (req: Request, res: Response, next) => {
    res.xml = xml;

    // Parse XML request body.
    let type = req.type;
    if (type == "application/xml" || type == "text/xml") {
        try {
            req.body = await parseStringAsync(req.body, {
                async: true,
                explicitArray: false,
                explicitRoot: false
            });
        } catch (e) {
            req.body = null;
        }
    }
    await next();
});

function parsingType(req: IncomingMessage) {
    // Parse plain text and XML.
    let type = req.headers['content-type'];
    return plainType.test(type) || xmlType.test(type);
}

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