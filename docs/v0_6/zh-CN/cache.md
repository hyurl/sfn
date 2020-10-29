<!-- title: 缓存; order: 12 -->
## 基本概念

> 警告：自 SFN 0.5.2 版本起，框架内置的缓存功能已经被标为废弃，并在 v0.6 版本中正式移除，
> 推荐开发者实现自己的缓存服务并作为微服务来分布式运行。

## 示例：实现一个缓存服务

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