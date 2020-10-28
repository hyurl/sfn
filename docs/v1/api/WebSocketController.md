<!-- title: WebSocketController; order: 9 -->

## WebSocketController

WebSocketController manages messages come from a [socket.io](https://socket.io)
client.

When you define a method in a WebSocketController and bind it to a certain 
socket.io event, it will be called automatically when the event fires.

```ts
abstract class WebSocketController extends Controller { }
```

- [\<Controller\>](./Controller)

### 属性

- `socket` [\<WebSocket\>](./WebSocket) The current websocket context.
- `event` \<string\> The current active event (namespace included).
- `session` [\<Session\>](./Session) alias of `socket.session`.
- static `nsp` \<string\> Sets a specified namespace for WebSocket channel (used by
    SocketIO).
