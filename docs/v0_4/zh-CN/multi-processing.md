<!-- title: 多进程; order: 16 -->
# 基本概念

在历史版本中，SFN 提供了自己的多进程管理和通信模块，但从 0.3.0 版本起，SFN 使用 
[PM2](https://pm2.io) 作为其负载均衡器，因此多进程运行也依赖于 PM2，通常情况下，你只要使用
PM2 的 cluster 模式启动应用即可。

```sh
pm2 start dist/index.js -i max
```

上面的命令将会自动根据你的主机状况，启动合适的进程数量来使负载均衡达到最佳状态。

另外，SFN 的核心模块是针对多进程进行了优化的，因此你基本不需要担心多进程编程会带来并发控制问题，
一切都像单进程那么简单。

PM2 提供了很多有用的工具，使你能够轻松的管理你的应用，你应该前往其网站学习和了解更多关于它的
使用技巧。

## 进程间通信

虽然 PM2 提供了它自己的 IPC 通信解决方案，但在 SFN 应用中是非常不建议使用它的，因为它依赖于
**child_process** 模块，这可能会在不使用 PM2 的开发过程中导致程序出现意外。

在 SFN 中，要使你的进程能够相互通讯，你需要使用 
[ipchannel](https://github.com/hyurl/ipchannel) 模块，这是唯一一个设计能够同时工作在
单进程和多进程中的 IPC 工具包。这意味着即使你没有使用 PM2, 你所设计的逻辑依旧能够工作。

```typescript
import channel from "ipchannel";

// listening messages without event
channel.on("message", (sender, msg) => {
    console.log(`Peer ${sender} says: ${msg}`);
});

// By default, the channel is not connnected immediately, and `channel.pid` 
// (peer id) will only be available after the connection is established, so the 
// following code will output undefined since the channel is not open yet.
console.log(channel.pid); // => undefined

// If you check `channel.connected`, it will be false initially.
console.log(channel.connected); // => false

// Even the channel is not yet connected, you still can send messages now, they
// will be queued and flushed once the connection is established.
channel.to(1).send("This message is sent before connection.");

channel.on("connect", () => {
    // now that channel is connected
    console.log(channel.connected); // => true

    switch (channel.pid) {
        case 1:
            // listening messages with a custom event
            channel.on("custom-event", (sender, ...data) => {
                console.log(`Peer ${sender} emits: ${JSON.stringify(data)}`);
            });
            break;

        case 2:
            // send message to peer 1
            channel.to(1).send("Hi peer 1, I'm peer 2.");
            break;

        case 3:
            // send message with an event to peer 1
            channel.to(1).emit("custom-event", "hello world");
            break;

        case 4:
            // send message to all peers
            channel.to("all").send("all attention");
            // send message with an event to all peers
            channel.to("all").emit("custom-event", "all attention");
            break;
    }
});
```

## 并发控制

在多进程运行程序时，你很容易遇到并发控制的问题，例如两个进程同时修改文件，同时操作数据库
等等。为了解决这样的问题，你需要使用一个第三方模块
[cluster-synchronize](https://github.com/hyurl/cluster-synchronize) 来“同步”执行
逻辑（实际上还是异步的，但会依次有序的执行过程）。

```typescript
import { HttpController, route } from "sfn";
import synchronize from "cluster-synchronize";

export default class extends HttpController {
    @route.get("/example")
    async index() {
        await synchronize(async () => {
            // Do everything asynchronous and don't worry about concurrency 
            // control issues.
        });
        return "Hello, World!";
    }
}
```