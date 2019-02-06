"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BodyParser = require("body-parser");
const xml2js_1 = require("xml2js");
const util_1 = require("util");
const index_1 = require("../bootstrap/index");
const plainType = /text\/plain\b/;
const xmlType = /(text|application)\/xml\b/;
const parseStringAsync = util_1.promisify(xml2js_1.parseString);
index_1.router.use(BodyParser.text({
    type: parsingType
})).use(async (req, res, next) => {
    res.xml = xml;
    let type = req.type;
    if (type == "application/xml" || type == "text/xml") {
        try {
            req.body = await parseStringAsync(req.body, {
                ignoreAttrs: true,
                async: true,
                explicitArray: false,
            });
        }
        catch (e) {
            req.body = null;
        }
    }
    await next();
});
function parsingType(req) {
    let type = req.headers['content-type'];
    return plainType.test(type) || xmlType.test(type);
}
function xml(data) {
    this.type = "application/xml";
    if (data === null || data === undefined)
        return this.end();
    if (typeof data !== "object" || Array.isArray(data)) {
        throw new TypeError("The data passed to Response.xml() "
            + "must be an object that contains key-value pairs.");
    }
    let builder = new xml2js_1.Builder({ cdata: true });
    this.send(builder.buildObject(data));
}
//# sourceMappingURL=http-xml.js.map