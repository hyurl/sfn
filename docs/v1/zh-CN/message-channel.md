<!-- title: 消息通道; order: 10.1 -->

## 服务间通信

在多进程、分布式的应用中，各个程序之间无可避免的需要进行跨进程、跨服务的消息通信，这里
将要讲的，不是远程方法在调用时通过 IPC/RPC 的 Socket 通信方案，而是在分布式的服务系统中，
各个服务之间如何进行自定义消息通讯的问题。例如，一个很显然的问题，前端的 Web 服务器
可以与浏览器客户端通过 WebSocket 进行消息推送，而工作在后端的 RPC 服务器却无法直接和
客户端进行对话。

为了解决各个服务之间的通信问题，SFN 框架集成了消息通道机制，由一个名为 `MessageChannel`
的消息队列通过**发布-订阅**模型向系统中的各个服务广播消息，而在订阅了消息主题的服务进程
中，消息能够被监听器所接收。

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

与传统的消息总线机制不同，SFN 所包装的 MessageChannel 并不运行在某一台特定的服务器上，
它是分布式、去中心化的，在每一个服务器中都独立存在，凡是连接到该服务器上的其他服务程序，
都可以订阅其消息。这也意味着，并不是所有的服务都能够接收到通过 MessageChannel 发布的消息。
在上面的例子中，rpc-server-2 必须连接到 rpc-server-1，才能够接收到 `greeting` 主题发来的
消息。

## 推送 WebSocket 消息

同时，SFN 提供了基于 MessageChannel 的 WebSocket 消息机制（`app.message.ws`），并
将其封装成和 Socket.io 相同的方法，因此在使用上，基本上没有任何差异。

```typescript
// Push WebSocket message through all front end web server
app.message.ws.emit("greeting", "Hello, World!");

// Push WebSocket message via a specified web server
app.message.ws.via("web-server-1").emit("greeting", "Hello, World!");

// Push WebSocket message to a specified room
app.message.ws.via("web-server-1")
    .to("SYGJBR5az95_37HhAAAB")
    .emit("greeting", "Hello, World!");

// ...
```

除了上述例子，诸如 `of(nsp: string)`, `volatile`, `local`, `binary()` 等特性也都是
支持的。为了统一，除了在 WebSocket 控制器中，其他地方请始终通过 `app.message.ws` 来推送
消息。

## 推送 SSE (Server-Sent Events) 消息

除了 `app.message.ws`，SFN 还提供了 `app.message.sse` 来进行跨服务推送 SSE 消息，
其用法和前者类似，它提供了 `send(data: any)`、`emit(event: string, data?: any)` 和
`close()` 方法来推送消息和事件。

```typescript
// Push SSE message through all front end web server
app.message.sse.send("Hello, World!");

// Push SSE message with event via a specified web server
app.message.sse.via("web-server-1").emit("greeting", "Hello, World!");

// Push SSE message to a specified client
app.message.sse.via("web-server-1")
    .to("PbiJhda21")
    .emit("greeting", "Hello, World!");

// Close the SSE connection
app.message.sse.via("web-server-1")
    .to("PbiJhda21")
    .close();
```

和 `app.message.ws` 类似，除了在 Http 控制器中，其他请始终通过 `app.message.sse` 来推送
SSE 消息。
