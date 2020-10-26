<!-- title: 服务; order: 2.1 -->
## 基本概念

在分布式系统中，**服务**是最基本也是最重要的概念。自 1.0 版本起，SFN 现在包含了一个新的名为
[Microse](https://github.com/microse-rpc/microse-node) 的 RPC 引擎，它提供了极其简单
而高效的分布式服务开发方案。在开发过程中，你几乎不会感觉到你在做分布式系统，一切开发任务都在单机
单进程中进行，然而在实际部署时，却能够轻松地将服务分离开来，实现跨网络运行。

## 创建新服务

编写一个新的服务类文件，将其存储在 `src/service/` 目录下，并保证文件名和命名空间
下的变量名称相同。让我们来看看下面的简单缓存服务示例：

```typescript
// src/services/cache.ts
import * as fs from "fs-extra";
import get = require("lodash/get");
import has = require("lodash/has");
import set = require("lodash/set");
import unset = require("lodash/unset");
import { ModuleProxy } from "microse";

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

然后在需要的地方，使用命名空间来访问这个服务的实例并调用其方法：

```typescript
(async () => {
    await app.services.cache.set("something", "This is a test");
    // ...
})();
```

更多关于服务的示例，请直接查看当前网站的[源代码](https://github.com/hyurl/sfn/tree/master/src/services)。

## 分布式服务

Microse 引擎允许尽量简单地将服务分离出来并作为 RPC 调用，从而将 Web 服务器所承载的压力尽可能
减小，并提高稳定性。这个特性也是 SFN 分布式系统的核心。

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
服务被依赖，也可以直接将 `dependencies` 选项设置成 `all`，从而连接所有的 RPC 服务。

## 基本服务

为了方便，框架内置了一个集成的服务类 `Service`，它提供了一些有用的方法，例如
`i18n`, `throttle`, `queue` 等，开发者可以使用它们来实现相关的功能，只需要将新建
的服务继承自这个标准的服务即可。

```ts
import { Service } from "sfn";

export default class MyService extends Service {
    throttledOps(...args: any[]) {
        return this.throttle("a unique key", async () => {
            return this.i18n("This method can only be called once for every second");
        }, 1000);
    }

    queuedOps(...args: any[]) {
        return this.queue("a unique key", async () => {
            return this.i18n("All calls to this method will be queued up");
        });
    }
}
```

实际上，包括 HTTP 控制器和 WebSocket 控制器，也是继承自这个服务类的，接下来的章节
会讲到。

## 服务初始化和销毁

SFN v1 运行在 Microse 引擎之上，它提供了服务生命周期控制的能力。当一个服务存在一个 `init()`
方法的时候，它将会在系统启动时被自动调用，用以为服务进行一些初始化工作，例如进行数据库连接等。但
需要注意这个特性仅支持作为 RPC 服务运行的一类服务。

和初始化一样，如果一个服务中存在 `destroy()` 方法，那么它会在服务器关闭时被调用，
从而进行释放资源，垃圾回收等操作。

框架内置的 `Service` 类已经默认定义了这两个方法，用来进行一些简单的工作，如服务
内存数据的自动垃圾回收机制，如果扩展的服务需要重载这些方法，那么它么应该在方法内部
也调用父类的方法，以保证内置的功能能够尽量可用。

```ts
import { Service } from "sfn";

export default class MyService extends Service {
    async init() {
        await super.init();
        // ...
    }

    async destroy() {
        await super.destroy();
        // ...
    }
}
```

## 自定义垃圾回收

如上面所说，`Service` 基类维持了一个内部的垃圾回收机制，而在扩展类中，当然也可以
扩展这个垃圾回收机制，来实现定时清理自定义的数据。方法很简单，只要重载基类的
`gc()` 方法即可。

```ts
import { Service } from "sfn";

export default class MyService extends Service {
    protected async gc() {
        await super.gc(); // make sure the parent's gc is applied.
        // ...
    }
}
```

`gc()` 方法的调用时机默认由内部的定时器决定，但当 `destroy()` 方法被调用时，
`gc()` 总是会被同时调用。

## 跨语言支持

Microse 是一个支持多种编程语言的 RPC 引擎，这意味着你在 SFN 框架中编写的服务也可以被其他语言
编写的程序调用（或者反过来），例如可以在 Python 中调用上面的 Cache 服务：

```py
from microse.app import ModuleProxyApp
import asyncio

app = ModuleProxyApp("app")

async def main():
    client = app.connect("ws://localhost:4001")
    client.register(app.services.cache)

    await app.services.cache.set("something", "This is a test")

    cache = await app.services.cache.get("something") # This is a test

    client.close()

asyncio.get_event_loop().run_until_complete(main())
```

更多关于 Microse 的信息，请前其 [GitHub 页面](https://github.com/microse-rpc)。
