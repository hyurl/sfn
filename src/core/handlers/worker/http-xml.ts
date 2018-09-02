import * as BodyParser from "body-parser";
import { Builder, parseString, OptionsV2 } from "xml2js";
import { IncomingMessage } from "http";
import { promisify } from "es6-promisify";
import { app } from "../../bootstrap/index";
import { Request, Response } from "../../tools/interfaces";

const plainType = /text\/plain\b/;
const xmlType = /(text|application)\/xml\b/;
const parseStringAsync = promisify<any, any, OptionsV2>(parseString);

app.use(<any>BodyParser.text({
    type: parsingType
})).use(async (req: Request, res: Response, next) => {
    res.xml = xml;

    // Parse XML request body.
    let type = req.type;
    if (type == "application/xml" || type == "text/xml") {
        try {
            req.body = await parseStringAsync(req.body, {
                ignoreAttrs: true,
                async: true,
                explicitArray: false,
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

function xml(data: { [key: string]: any }): void {
    this.type = "application/xml";
    if (data === null || data === undefined)
        return this.end();
    if (typeof data !== "object" || Array.isArray(data)) {
        throw new TypeError("The data passed to Response.xml() "
            + "must be an object that contains key-value pairs.");
    }
    let builder = new Builder({ cdata: true });
    this.send(builder.buildObject(data));
}