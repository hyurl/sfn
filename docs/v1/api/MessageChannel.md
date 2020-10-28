<!-- title: MessageChannel; order: 6 -->

## MessageChannel

A decentralized message channel implements pub-sub model used to communicate
between distributed services.

This class is not intended to be called in user code, use [app.message](#app_message) instead.

## 方法

### publish

Publishes `data` to the given `topic` in the channel, if `servers` are provided,
the topic will only be emitted to them.

```ts
publish(topic: string, data?: any, servers?: string[]): boolean;
```

### subscribe

Subscribes a `listener` function to the given `topic` of the channel.

```ts
subscribe(topic: string, listener: (data: any) => void): this;
```

### unsubscribe

Unsubscribes the `listener` function or all listeners bound to the `topic`.

```ts
unsubscribe(topic: string, listener?: (data: any) => void): boolean;
```

## app.message

The default instance of [MessageChannel](#MessageChannel).

## app.message.ws

An instance of `WebSocketMessage`, used to send websocket messages across the
distributed system.

### app.message.ws.via

Sends the message via a front-end web server.

```ts
via(appId: string): WebSocketMessage;
```

### app.message.ws.to

Sends the message to a specified target.

```ts
to(target: string): WebSocketMessage;
```

### app.message.ws.volatile

Sets a modifier for a subsequent event emission that the event data may be lost
if the client is not ready to receive messages

```ts
get volatile(): WebSocketMessage;
```

### app.message.ws.local

Sets a modifier for a subsequent event emission that the event data will only be
broadcast to the current node (when the
[Redis adapter](https://github.com/socketio/socket.io-redis) is used).

```ts
get local(): WebSocketMessage;
```

### app.message.ws.of

Initializes and retrieves the given namespace by its pathname identifier `nsp`.
If the namespace was already initialized it returns it immediately.

```ts
of(nsp: string): WebSocketMessage;
```

### app.message.ws.binary

Specifies whether there is binary data in the emitted data, increases
performance when specified.

```ts
binary(hasBinary?: boolean): WebSocketMessage;
```

### app.message.ws.emit

Emits an event to the socket identified by the string name.

```ts
emit(event: string, ...data: any[]): boolean;
```

### app.message.ws.send

Sends a `message` event.

```ts
send(...data: any[]): boolean;
```

## app.message.sse

An instance of `SSEMessage`, used to send SSE messages across the distributed
system.

### app.message.sse.via

Sends the message via a front-end web server.

```ts
via(appId: string): SSEMessage;
```

### app.message.sse.to

Sends the message to a specified target.

```ts
to(target: string): SSEMessage;
```

### app.message.sse.emit

Emits an event to the socket identified by the string name.

```ts
emit(event: string, data?: any): boolean;
```

### app.message.sse.send

Sends a `message` event.

```ts
send(data: any): boolean;
```

### app.message.sse.close

Closes the SSE channel.

```ts
close(): boolean;
```
