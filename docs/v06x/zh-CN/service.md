<!-- title: 服务; order: 10 -->
# 基本概念

在分布式系统中，**服务**是最基本也是最重要的概念。通过
[Alar](https://github.com/hyurl/alar) 框架所提供的 RPC 能力，SFN 提供了极其简单
而高效的分布式服务开发方案。在开发过程中，你几乎不会感觉到你在做分布式系统，一切
开发任务都在单机单进程中进行，然而在实际部署时，却能够轻松地将服务分离开来，实现
分布式运行。

## 定义服务类

编写一个新的服务类文件，将其存储在 `src/service/` 目录下，并保证这个文件的名称
和将会使用到的变量名称相同。让我们来看看下面的示例，这是现在这个网站上正在使用的
一个简单的缓存服务。

(注：`ModuleProxy` 是 Alar 框架的一个全局接口，无需导入，直接使用。)

```typescript
// src/services/cache.ts
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

    async init() {
        await this.cache.sync();
    }

    async destroy() {
        await this.cache.close();
    }

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

然后在需要的地方，使用命名空间来访问这个服务的实例并调用其方法：

```typescript
(async () => {
    await app.services.cache.instance().log("This is a test log");
    // ...
})();
```

更多关于服务的示例，请直接查看当前网站的[源代码](https://github.com/hyurl/sfn/tree/master/src/services)。

## 服务分离

SFN 所使用的 [Alar](https://github.com/hyurl/alar) 框架允许将服务分离出来并作为
RPC 调用，这样并可以将 Web 服务器所承载的压力尽可能减小，从而提高稳定性。这个特性
也是 SFN 分布式系统的核心。

要进行服务分离，你只需要进行简单的配置：

```typescript
// src/config.ts
export default <app.Config>{
    server: {
        rpc: {
            "cache-server": {
                host: "localhost",
                port: 4004,
                services: [app.services.cache]
            }
        }
    }
}
```

编译程序，然后使用下面的命令来启动这个新的服务器：

```sh
node dist cache-server
```

## 服务依赖

通过上面的命令启动这个缓存服务器之后，Web 服务器（承载 HTTP 和 WebSocket 的服务器）
就能够将所有该服务的引用自动重定向到这个远程服务器上，你基本上不需要修改任何现有
的代码（但需要注意所有的属性都不支持远程访问，并且方法都会变成异步的）。

而如果你想要让运行在另一个 RPC 服务器上的服务也能对这个服务进行远程访问，那么，
还需要为另一个 RPC 服务器配置服务依赖，像下面这样：

```typescript
// src/config.ts
export default <app.Config>{
    server: {
        rpc: {
            "doc-server": {
                host: "localhost",
                port: 4001,
                services: [app.services.docs],
                dependencies: [app.services.cache]
            }
        }
    }
}
```

这样一来，运行在 doc-server 上的程序在调用 `app.services.cache` 服务时，就能够将
流量路由到承载了该服务的服务器上（无论配置了多少台服务器来承载该服务）。

Web 服务器和 RPC 服务器上的设计不同是因为，通常地，Web 服务器需要连接的后端 RPC 
服务会更多（尤其是对于 Web 应用程序而言），而一个 RPC 服务器上对另外的 RPC 服务的
依赖则会少很多，通常只会用到少部分的服务和功能。当然，如果你不清楚到底会有哪些
服务被依赖，也可以直接将 `dependencies` 属性设置成 `all`，从而连接所有的 RPC 服务。