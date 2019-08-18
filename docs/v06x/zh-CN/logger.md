<!-- title: 日志; order: 11 -->
# 基本概念

> 警告：自 SFN 0.5.2 版本起，框架内置的日志功能已经被标为废弃并在 v0.6 版本中完全
> 移除，推荐开发者实现自己的日志服务并作为微服务来分布式运行。

## 示例：实现一个简单的日志服务

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