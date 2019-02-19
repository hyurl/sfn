<!-- title: 会话; order: 8 -->
# 基本概念

在 **SFN** 框架中，会话是默认开启的，并且在 HTTP 和 WebSocket 中共享。框架使用 
[express-session](https://www.npmjs.com/package/express-session) 来实现会话支持，
并且使用 [session-file-store](https://www.npmjs.com/package/session-file-store)
作为其默认的存储引擎。

## 配置

你可以修改 `config.ts` 来设置合适的配置以满足自己的会话需要，下面的示例是框架默认使用
的。

```typescript
import * as Session from "express-session";
import * as FileStore from "session-file-store";

let Store = <any>FileStore(Session);

export default <SFNConfig>{
    // ... 
    session: {
        secret: "sfn",
        name: "sfn-sid",
        resave: true,
        saveUninitialized: true,
        unset: "destroy",
        store: new Store(),
        cookie: {
            secure: true
        }
    },
    // ...
}
```

另外，你也可以修改为其他可用的存储引擎，如果你想要这么做。

## 在 HTTP 和 WebSocket 之间共享状态

这个特性在 **SFN** 框架中是很重要的，会话共享允许你只更改一端的状态，便能够影响到另外
一端，而不需要进行任何额外重复的工作，它保证了一旦你通过 HTTP 登录之后，你的 
WebSocket 端也同时登录了（相反亦然）。

## 如何使用？

`session` 属性被绑定到了控制器的 `req` 和 `socket` 对象上（以及 
[webium](https://github.com/hyurl/webium) 和 [socket.io](https://socket.io) 的
中间件），它和 [express-session](https://www.npmjs.com/package/express-session) 
所描述的是一样的，你必须自己去看一下这个模块，如果你还不了解它。

在 HTTP 端，会话信息会在响应通道关闭时被自动地保存，但在 WebSocket 端，出于性能考虑，
框架不会自动地保存会话信息，你必须要自己来做这一点，就像这样：

```typescript
import { WebSocketController, WebSocket, event } from "sfn";

export default class extends WebSocketController {
    @event("/example")
    index(socket: WebSocket) {
        socket.session.data = "something";
        socket.session.save(() => null);
        return "anything";
    }
}
```