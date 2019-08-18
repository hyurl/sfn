<!-- title: Logging; order: 11 -->
# Concept

> Warning: since SFN 0.5.x, the built-in logger function has be deprecated, and
> fully removed since v0.6, it is recommended that a user should implement his 
> own logger service and runs it distributed as a micro-service.

## Example: implement a simple logger service

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