<!-- title: Deprecated; order: 17 -->

## ORM

History versions of SFN used [Modelar](https://github.com/hyurl/modelar) as its
default ORM system, however, due to some issues happened during practices, and
it restricted the usage of other ORM systems or the MongoDB, so since v0.6, SFN
removed all bindings with Modelar, and encourages users to port their desired 
ORM systems.

## E-mail

Since v0.6, it is recommended that the developer should implement his own mail
service and runs as a micro-service. You can have a look at the
[sfn-mail](https://github.com/hyurl/sfn-mail) wrapper for
[NodeMailer](https://github.com/nodemailer/nodemailer), in case you want to
implement your own mail service.

## Logger

> Warning: since SFN 0.5.x, the built-in logger function has been deprecated,
> and fully removed since v0.6, it is recommended that a user should implement
> his own logger service and runs it distributed as a micro-service.

### Example: implement a simple logger service

```ts
import * as Logger from "sfn-logger";

declare global {
    namespace app {
        interface Config {
            logger?: Logger.Options
        }
        namespace services {
            const logger: ModuleProxy<LoggerService>;
        }
    }
}

export default class LoggerService extends Logger {
    constructor() {
        super({
            filename: app.ROOT_PATH + "/logs/sfn.log",
            ttl: 1000,
            fileSize: 1024 * 1024 * 2,
            trace: false,
            ...app.config.logger
        });
        this.dateFormat = "YYYY-MM-DD HH:mm:ss";
    }

    async debug(...msg: any[]) {
        return super.debug(...msg);
    }

    async error(...msg: any[]) {
        return super.error(...msg);
    }

    async info(...msg: any[]) {
        return super.info(...msg);
    }

    async log(...msg: any[]) {
        return super.log(...msg);
    }

    async warn(...msg: any[]) {
        return super.warn(...msg);
    }
}
```

## Cache

> Warning: since SFN 0.5.x, the built-in cache function has been deprecated,
> and fully removed since v0.6, it is recommended that a user should implement
> his own cache service and runs it distributed as a micro-service.

### Example: implement a simple cache service

```ts
import * as fs from "fs-extra";
import get = require("lodash/get");
import has = require("lodash/has");
import set = require("lodash/set");
import unset = require("lodash/unset");

declare global {
    namespace app {
        namespace services {
            const cache: ModuleProxy<CacheService>;
        }
    }
}

export default class CacheService {
    protected cache: { [path: string]: any } = {};
    protected filename = app.ROOT_PATH + "/cache/cache-service.json";

    async init() {
        try {
            let data = await fs.readFile(this.filename, "utf8");
            this.cache = JSON.parse(data);
        } catch (e) { }
    }

    async destroy() {
        let data = JSON.stringify(this.cache);
        await fs.writeFile(this.filename, data, "utf8");
    }

    async get<T>(path: string) {
        return get(this.cache, path);
    }

    async has(path: string) {
        return has(this.cache, path);
    }

    async set<T>(path: string, data: T) {
        return set(this.cache, path, data);
    }

    async delete(path: string) {
        return unset(this.cache, path);
    }
}
```
