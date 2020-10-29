<!-- title: Logging; order: 11 -->
# Concept

**Warning: since SFN 0.5.x, the built-in logger function has be deprecated,**
**it is recommended that a user should implement his own logger service and runs**
**it distributed as a micro-service.**

You may have seen the `logger` property in the [Service](./service) page, its 
backed by [sfn-logger](https://github.com/hyurl/sfn-logger) module actually.
You may want to learn more complicated details about this module, but in 
**SFN**, it's not necessary, for most of the case, you would only need to call
it from the `logger` property.

By default, logs are stored in `src/logs/` directory.

## How To Use?

The `logger` object is very similar to the native `console` object, so does 
usage, you don't have to learn anything new before using it, just changing you 
habit, use `logger` instead of `console` when you want to log to a file.

### Example

```typescript
import { Service } from "sfn";
import { User } from "modelar";

var srv = new Service;

(async (id: number) => {
    try {
        let user = <User>await User.use(srv.db).get(id);
        srv.logger.log(`Getting user (id: ${id}, name: ${user.name}) succeed.`);
        // ...
    } catch (e) {
        srv.logger.error(`Getting user (id: ${id}) failed: ${e.message}.`);
    }
})(1);
```

## Difference Between `logger` And `console`

There are three major differences in `logger` than `console`. 

- `logger` writes logs to a disk file.
- `logger` is asynchronous and non-blocking.
- `logger` is safe in multi-processing scenario, you don't have to worry 
    *concurrency control*.

## Configuration

You can set configurations in a service class definition, the `logOptions` 
property is you target, the following example shows you how to configure the 
logger to over-write the log file when it's size approaches 2Mb, and send file
contents to an e-mail address.

### Example of Logger Configurations

```typescript
// src/controllers/Example.ts
import { HttpController, Request, Response, config, route } from "sfn";

export default class extends HttpController {
    constructor(req: Request, res: Response) {
        super(req, res);
        this.logOptions.ttl = 0;
        this.logOptions.size = 1024 * 1024 * 2; // 2Mb
        this.logOptions.mail = Object.assign({}, config.mail, {
            subject: "[Logs] from my website",
            to: "reciever@example.com"
        });
    }

    @route.get("/example")
    index() {
        this.logger.log("An example log.");
        return true;
    }
}
```

## Auto Stack Trace

When logging, **sfn-logger** will automatically trace the invoking stack (
configurable, enabled by default in SFN), and output records with the caller 
function, the filename, the line number and the column number,  when the method 
`index()` is called, it will log something like this:

```plain
[2018-10-17T17:48:16] [DEBUG] [default.index (d:/my-website/src/controllers/Example.ts:16:24)] - An example log.
```

## Special Performance in **SFN**

In the **SFN** framework, the `logger` property in the service, has some 
special performance different to the original `new Logger()` from 
**sfn-logger** module. 

First, logger instances are cached in memory and differed by filenames, that 
means even in different services, if only you set the `logOptions.filename` to 
a same name, that won't make a deference, only the first referenced 
configuration will be used.