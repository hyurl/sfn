<!-- title: 服务; order: 10 -->
# 基本概念

**服务**是 SFN 框架中最基本也是最重要的概念。


`Service` 类是 **SFN** 框架中的一个基类，其他类如 `HttpController`、
`WebSocketController` 都继承自它。它提供了一些有用的方法，如 `i18n`、`success`、
`error` 等，能够让你用来做一些简单的事情。

# 如何使用？

`Service` 类，继承自 `EventEmitter`，用法也相同，你可以定义一个新的类来扩展服务，
或者直接使用它。为了方便，你应该将你的服务文件存储在 `src/service/` 目录下。

## 示例

### 直接使用 Service

```typescript
import { Service } from "sfn";
import { User } from "modelar";

var srv = new Service;

(async (id: number) => {
    try {
        let user = <User>await User.use(srv.db).get(id);
        srv.logger.log(`Getting user (id: ${id}, name: ${user.name}) succeed.`);
        // ...
    } catch (e) {
        srv.logger.error(`Getting user (id: ${id}) failed: ${e.message}.`);
    }
})(1);
```

### 定义一个新的服务类

你可以定义一个新的服务类来存储一些常用功能的执行过程。

```typescript
// src/services/myService.ts
import { Service } from "sfn";
import { User } from "modelar";

declare global {
    namespace app {
        namespace services {
            const myService: ModuleProxy<MyService>;
        }
    }
}

export default class MyService extends Service {
    async getUser(id: number): User {
        let user: User = null;

        try {
            let data = this.cache.get(`user[${id}]`);

            if (data) {
                user = (new User).assign(data);
            } else {
                user = <User>await User.use(this.db).get(id);
                this.cache.set(`user.${id}`, user.data);
            }

            this.logger.log(`Getting user (id: ${id}, name: ${user.name}) succeed.`);
        } catch (err) {
            this.logger.error(`Getting user (id: ${id}) failed: ${err.message}.`);
        }

        return user;
    }
}
```

然后在需要的地方，使用命名空间来访问这个服务的实例：

```typescript
(async () => {
    let user = await app.services.myService.instance().getUser(1);
    // ...
})();
```

# 服务分离

SFN 所使用的 [Alar](https://github.com/hyurl/alar) 框架允许将服务分离出来并作为 RPC 
调用，这样并可以将 Web 服务器所承载的压力尽可能减小，从而提高稳定性。这个特性也被用来
快速地搭建分布式的服务系统。

要进行服务分离，你只需要进行简单的配置：

```typescript
// src/config.ts
export default <SFNConfig>{
    server: {
        rpc: {
            "rpc-server-1": {
                host: "127.0.0.1",
                port: 8081,
                modules: [app.services.myService]
            }
        }
    }
}
```

然后创建一个新的程序文件保存在 `src/` 目录下，将其命名为 `rpc-server-1.ts`，其内容大致如下：

```typescript
// src/rpc-server-1.ts
import "sfn";

app.rpc.serve("rpc-server-1");
```

编译并使用命令 `node dist/rpc-server-1` 来启动这个独立的服务，并使用 `connect()` 方法来
连接这个远程服务器（你也可以使用 `connectAll()` 方法来一次性连接所有的远程服务器。）：

```typescript
app.rpc.connect("rpc-server-1");
```

之后项目中所有对该服务的引用都会被重定向到这个远程服务上，你基本上不需要修改任何现有的代码，但
需要注意所有的属性都不支持远程访问，并且方法都会编程异步的。