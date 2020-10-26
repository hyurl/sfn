<!-- title: Message Channel; order: 10.1 -->

# Inner-Service Communication

When it comes to multi-processing and distributed applications, each program
must face the need of communication across processes and across services. What 
I'm about to discuss, is not the IPC/RPC scheme that remote methods work
inside, instead, it's about how the services are communicated individually
with each other. e.g. one obvious problem is, the front end web server can push
messages to browser clients via WebSocket, but the RPC server works in the
background cannot communicate with clients directly.

To solve the problem of inner-service communication, SFN integrated a
massage channel, via a message queue named `MessageChannel`, the system can
broadcast messages using a **pub-sub** model, and any service process subscribes
the topic, the message can be received by its listeners.

By default, you don't have to create the instance of MessageChannel, SFN 
exporting it is just for typing usage, to access the integrated message queue,
you just need to use the `app.message` interface.

### Publish Messages

```typescript
// rpc-server-1
app.message.publish("greeting", "Hello, World!");
```

### Subscribe Messages

```typescript
// rpc-server-2
app.message.subscribe("greeting", msg => {
    console.log(msg); // Hello, World!
});
```

Unlike the traditional message queue mechanism, the MessageChannel that SFN 
provided doesn't run on a specific server, it's distributed, decentralized and
exists on every individual server, any other services connected to the server
can subscribe its topics. Which means, not every service could receive the
messages published by the MessageChannel. In the above example, rpc-server-2 
must connect to rpc-server-1 in order to receive the `greeting` topic.

# Push WebSocket Messages

At the same time, SFN provides a WebSocket message mechanism (`app.message.ws`)
based on MessageChannel, and packs it to the same methods as Socket.io provides,
so the usage is pretty much about the same.

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

Other than the above examples, other features like `of(nsp: string)`,
`volatile`, `local`, `binary()` are also available. For consistency, if it's
not in a controller, please always push messages via `app.message.ws`.

# Push SSE (Server-Sent Events) Messages

Other than `app.message.ws`, SFN also provides `app.message.sse` to push SSE 
messages across services, which has a similar usage, it provides methods
`send(data: any)`、`emit(event: string, data?: any)` and `close()` to push 
messages and events.

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

Same rule as `app.message.ws`, except in a controller, please always use 
`app.message.sse` to push SSE messages.