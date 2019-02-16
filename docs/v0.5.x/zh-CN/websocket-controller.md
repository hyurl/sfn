<!-- title: WebSocket 控制器; order: 4 -->
# 基本概念

`WebSocketController` 处理来自 [socket.io](https://socket.io/) 客户端的消息。

由于这个模块使用 socket.io，你需要提前学习它，从而能够完全处理你的工作。

# 如何使用？

如同 **HttpController**，你创一个文件存储在 `src/controllers` 中，这个文件应该导出
一个默认的类并继承自 `WebSocketController`，然后它就能够在服务器启动时被自动的加载。

大多数 **HttpController** 中的特性，在 **WebSocketController** 中都可以使用，或者
可以找到相似的版本，所以请认真查看 [HttpController](./http-controller) 的文档。

## 示例

```typescript
import { WebSocketController, event } from "sfn";

export default class extends WebSocketController {
    @event("/demo")
    index() {
        return "Hello, World!";
    }
}
```

## 事件和方法的关系

当一个方法被 `@event` 修饰时，这个方法将会被绑定到一个确定的 socket.io 事件上。当
一个客户端发送数据到这个事件上时，这个方法就会被自动地调用，其返回值将会被自动地以合适
的形式返回给客户端。

### 设置命名空间

默认地，WebSocket 事件被绑定到根命名空间 `/`，你可以设置静态属性 `nsp` 来修改为其他的
路径。

```typescript
export default class extends WebSocketController {
    static nsp = "/api";

    /**
     * @example
     * var socket = io.connect("http://localhost/api")
     */
    @event("/user/:uid")
    getUser(uid: number) {
        // ...
    }
}
```

## 方法的签名

所有在 WebSocketController 中绑定到唯一事件上的方法支持任何个数的参数，它们和 
SocketIO 客户端发送得数据是一一对应的：

```typescript
import { WebSocketController, WebSocket, event } from "sfn";

export default class extends WebSocketController {
    /**
     * On client side:
     *      socket.emit("event1", "Hello, World!");
     */
    @event("/event1")
    event1(str: string) {
        return str; // => 'Hello, World!'
    }

    /**
     * On client side:
     *      socket.emit("event2", "Hello, World!", "Hi, sfn!");
     */
    @event("event2")
    event2(str: string, str2: string) {
        return [str, str2]; // => ['Hello, World!', 'Hi sfn!']
    }
}
```

更多详情请查看 [依赖注入](./di#在控制器中自动注入)。

### 构造函数

有些时候你可能想要在真正的方法被调用前做一些事情，你可能想要进行一些额外的配置，在类被
实例化前，你想要自定义类的 `constructor`。就像下面这样：

```typescript
import { WebSocketController, WebSocket } from "sfn";

export default class extends WebSocketController {
    constructor(socket: WebSocket) {
        super(socket);
        
        // your stuffs...
    }
}
```

### 关于 WebSocket 的提示

`WebSocekt` 是一个 TypeScript 接口，实际上在 **SFN** 框架中存在着很多的接口（和 
别名类型）。它们并不是类，因此也不能被实例化，或者使用 `instanceof` 来检测，如果
你在代码中有任何这样的代码，那只会给你自己造成麻烦。

```typescript
// This example is wrong and should be avoid.

var obj = new WebSocket;

if (obj instanceof WebSocket) {
    // ...
}
```

### 在控制器中抛出 SocketError

`SocketError` 是一个由框架定义的错误类，它是安全的，你可以在想要响应一个 HTTP 错误到
客户端时使用它。当一个 SocketError 被抛出时，框架将会对其进行合适的处理，并自动地发送
错误响应内容。

`SocketError` 和 `HttpError` 几乎是一样的，因此在 SocketError 中使用 HTTP 错误
代码是很常见的。

```typescript
import { WebSocketController, SocketError, event } from "sfn";

export default class extends WebSocketController {
    @event("/example")
    example() {
        let well: boolean = false;
        let msg: string;
        // ...
        if (!well) {
            if (!msg)
                throw new SocketError(400); // => 400 bad request
            else
                throw new SocketError(400, msg); // => 400 with customized message
        }
    }
}
```

当一个 SocketError 被抛出时，框架总是会发送一个包含着 
`{success: false, code, error}` 的消息到客户端，这个响应形式来自于控制器方法
[error()](./http-controller#Common-API-response)。

## 自定义 Adapter

SFN 使用 SocketIO 来启动 WebSocket 服务，因此你可以使用所有 SocketIO 的特性，包括
自定义 Adapter, 内置的 WebSocket 会话数据存储在内存中，这样会带来很多不便，例如多个
进程间无法共享在线用户信息，并且在进程重启时会导致用户状态失效等。因此建议是使用另外的
Adapter，例如 [socket.io-redis](https://www.npmjs.com/package/socket.io-redis)，
关于 Redis 的好处我就不多说了，你可以自行去了解。

```typescript
// <SRC_PATH>/bootstrap/websocket.ts
import { ws } from "sfn";
import * as RedisAdapter from "socket.io-redis";

ws.adapter(RedisAdapter({ host: "localhost", port: 6379 }));
```

## WebSocketController 与服务

一个控制器实际上就是一个服务，你可以在一个控制器中使用任何在 [Service](./service) 
中有效的特性。


## 热重载

SFN 支持在控制器程序文件被改变时自动热重载，并且现在已经默认开启了。然而这依旧只是一个实验性的
特性，并仅在开发模式中起作用。