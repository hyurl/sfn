<!-- title: 缓存; order: 12 -->
# 基本概念

> 警告：自 SFN 0.5.2 版本起，框架内置的缓存功能已经被标为废弃，并在 v0.6 版本中正式移除，
> 推荐开发者实现自己的缓存服务并作为微服务来分布式运行。

## 示例：实现一个缓存服务

```ts
import { Storage, StoreOptions } from "cluster-storage";

declare global {
    namespace app {
        interface Config {
            cache?: StoreOptions & { name: string };
        }
        namespace services {
            const cache: ModuleProxy<CacheService>;
        }
    }
}

export default class CacheService {
    protected cache: Storage;

    async set<T>(path: string, data: T, ttl?: number) {
        return this.cache.set(path, data, ttl);
    }

    async get<T>(path: string) {
        return this.cache.get<T>(path);
    }

    async has(path: string) {
        return this.cache.has(path);
    }

    async delete(path: string) {
        return this.cache.delete(path);
    }

    close() {
        return this.cache.close();
    }

    destroy() {
        return this.cache.destroy();
    }

    sync() {
        return this.cache.sync();
    }

    static getInstance() {
        let service = new this;
        let options: app.Config["cache"] = {
            name: "sfn",
            path: app.ROOT_PATH + "/cache",
            ...app.config.cache
        };

        service.cache = new Storage(options.name, options);

        return service;
    }
}
```

更多关于 **cluster-storage** 的细节，例如配置和 API，可以
[在 GitHub 上查阅它](https://github.com/hyurl/sfn-cache)。但需要指出的，
cluster-storage 仅适合缓存数据量不大的情况，对于缓存数据大的情景，最好
还是搭配 Redis 比较合适，为此，SFN 也专门提供了一个简单的 Redis 缓存封装
[sfn-cache](https://github.com/hyurl/sfn-cache)。