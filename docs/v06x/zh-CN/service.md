<!-- title: 服务; order: 2.1 -->
## 基本概念

在分布式系统中，**服务**是最基本也是最重要的概念。通过
[Alar](https://github.com/hyurl/alar) 框架所提供的 RPC 能力，SFN 提供了极其简单
而高效的分布式服务开发方案。在开发过程中，你几乎不会感觉到你在做分布式系统，一切
开发任务都在单机单进程中进行，然而在实际部署时，却能够轻松地将服务分离开来，实现
分布式运行。

## 创建新服务

编写一个新的服务类文件，将其存储在 `src/service/` 目录下，并保证文件名和命名空间
下的变量名称相同。让我们来看看下面的简单缓存服务示例：

(注：`ModuleProxy` 是 Alar 框架的一个全局接口，无需导入，直接使用。)

```typescript
// src/services/cache.ts
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

然后在需要的地方，使用命名空间来访问这个服务的实例并调用其方法：

```typescript
(async () => {
    await app.services.cache.instance().set("something", "This is a test");
    // ...
})();
```

更多关于服务的示例，请直接查看当前网站的[源代码](https://github.com/hyurl/sfn/tree/master/src/services)。

## 分布式服务

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

在分布式运行时，如果一个服务实例中存在一个 `init()` 方法，那么它将会在服务器启动时
被调用，从而对服务进行初始化工作。但需要注意的是，这并不是 Alar 框架的功能，而是
SFN 框架特别定制的功能，因此，它很显然地存在一些局限，在使用服务初始化时，一定要
特别注意下面这两点：

1. 服务将无法良好地进行热重载，因为热重载时无法再次初始化，会导致程序异常；
2. Web 服务器将无法正常调用该服务的本地版本，因为 Web 服务器并不会对服务进行初始化。

因此，在进行分布式系统开发时，最好禁用服务的本地化和热重载功能。方法是，在服务器
启动前调用所有服务的 `noLocal()` 方法，并且将 `app.services` 从配置文件的
`app.config.watch` 项目中移除。

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
        super.gc(); // make sure the parent's gc is applied.
        // ...
    }
}
```

`gc()` 方法的调用时机默认由内部的定时器决定，但当 `destroy()` 方法被调用时，
`gc()` 总是会被同时调用。