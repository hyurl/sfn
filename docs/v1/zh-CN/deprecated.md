<!-- title: 已废弃; order: 17 -->

## ORM

历史版本中，SFN 曾使用 [Modelar](https://github.com/hyurl/modelar) 作为它的默认
ORM 系统，但由于在实践中发现存在一些问题，并且这不利于系统使用其他的 ORM 或者
MongoDB 数据库，因此从 v0.6 版本起，SFN 移除了所有与 Modelar 绑定的东西，并鼓励
使用者自己引入所青睐的 ORM 系统。

## 邮件

自 v0.6 版本起，框架推荐开发者实现自己的邮件服务并作为微服务来分布式运行。你可以参考一下
[sfn-mail](https://github.com/hyurl/sfn-mail) 对 
[NodeMailer](https://github.com/nodemailer/nodemailer) 模块的封装，以便实现自己邮件
服务。

## 日志

> 警告：自 SFN 0.5.2 版本起，框架内置的日志功能已经被标为废弃，并从 v0.6 版本起正式移除，
> 推荐开发者实现自己的日志服务并作为微服务来分布式运行。

### 示例：实现一个简单的日志服务

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

## 日志

> 警告：自 SFN 0.5.2 版本起，框架内置的缓存功能已经被标为废弃，并从 v0.6 版本起正式移除，
> 推荐开发者实现自己的缓存服务并作为微服务来分布式运行。

### 示例：实现一个缓存服务

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
