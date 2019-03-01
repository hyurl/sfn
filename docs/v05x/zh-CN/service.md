<!-- title: 服务; order: 10 -->
# 基本概念

`Service` 类是 **SFN** 框架中的基本类，其他类如 `HttpController`、
`WebSocketController` 都继承自它。它提供了一些有用的特性，如 `i18n`、`logger`、
`cache` 等，能够让你用来做真正的事情。

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
需要注意所有的属性都不支持远程访问，并且方法都会被包装在 Promise 内。

# 服务间通信

这里将要讲的，不是远程方法在调用时通过 IPC/RPC 的 Socket 通信方案，而是在分布式的服务
系统中，各个服务之间如何进行消息通讯的问题。例如，一个很显然的问题，前端的 Web 服务器
可以与浏览器客户端通过 WebSocket 进行消息推送，而工作在后端的 RPC 服务器却无法直接和
客户端进行对话。

为了解决各个服务之间的通信问题，SFN 框架在 RPC Socket 的基础上集成了的消息通道机制，
由一个名为 `MessageChannel` 的消息队列通过**发布-订阅**模型向系统中的各个服务广播消息，
而在订阅了消息事件的服务进程中，消息能够被监听器所接收。

默认地，你不需要自己创建 MessageChannel 的实例，SFN 导出它只是用于类型注解，要访问集成
的消息队列，只需要通过调用 `app.message` 接口即可。

### 发布消息

```typescript
// rpc-server-1
app.message.publish("greeting", "Hello, World!");
```

### 订阅消息

```typescript
// rpc-server-2
app.message.subscribe("greeting", msg => {
    console.log(msg); // Hello, World!
});
```

与消息总线机制不同，SFN 所包装的 MessageChannel 并不运行在某一台特定的服务器上，它是
分布式的，在每一个 RPC 服务器中都独立存在，凡是连接到该 RPC 服务器上的其他服务程序，
都可以订阅其事件。这也意味着，并不是所有的服务都能够接收到通过 MessageChannel 发布的
消息。在上面的例子中，rpc-server-2 必须连接到 rpc-server-1，才能够接收到 `greeting`
事件发来的消息。

## 在 RPC 服务中推送 WebSocket 消息

同时，SFN 提供了基于 MessageChannel 的 WebSocket 消息机制（`app.message.ws`），并
将其封装成和 Socket.io 相同的方法，因此在使用上，基本上没有任何差异。

```typescript
// Push WebSocket message through all front end web server
app.message.ws.emit("greeting", "Hello, World!");

// Push WebSocket message via a specified web server
app.message.ws.via("web-server-1").emit("greeting", "Hello, World!");

// Push WebSocket message via a specified web server to a specified room
app.message.ws.via("web-server-1")
    .to("SYGJBR5az95_37HhAAAB")
    .emit("greeting", "Hello, World!");

// ...
```

除了上述例子，诸如 `of(nsp: string)`, `volatile`, `local`, `binary()` 等特性也都是
支持的。

`app.message.ws` 不只可以在 RPC 服务器上使用，也可以在 Web 服务器中使用（例如在控制器
中），为了统一，并且服务也可能只运行在本地，推荐是都通过 `app.message.ws` 来推送消息。