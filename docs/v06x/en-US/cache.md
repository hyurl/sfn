<!-- title: Cache; order: 12 -->
# Concept

> Warning: since SFN 0.5.x, the built-in cache function has be deprecated, and
> fully removed since v0.6, it is recommended that a user should implement his
> own cache service and runs it distributed as a micro-service.

## Example: implement a simple cache service

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

For more details about **cluster-storage**, like configurations and API, you can
[view it on GitHub](https://github.com/hyurl/sfn-cache). But it worth mentioned
that cluster-storage is only for situations with small amount of data, for large
amount of data, it's better company with Redis, and for that, SFN also provides
a simple Redis cache wrapper, [sfn-cache](https://github.com/hyurl/sfn-cache).