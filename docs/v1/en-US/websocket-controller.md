<!-- title: WebSocket Controller; order: 4 -->
# Concept

`WebSocketController` manages messages come from a 
[socket.io](https://socket.io/) client.

Since this module uses socket.io, you need to learn it before you can fully 
handle your work.

# How To Use?

Like **HttpController**, you create a file in `src/controllers`, this file 
should export a default class that extends `WebSocketController`, and it will 
be auto-loaded when the server starts.

Many features in **HttpController** can be used in **WebSocketController** as 
well, or a similar version can be found, please pay attention to the document of
[HttpController](./http-controller).

## Example

```typescript
import { WebSocketController, event } from "sfn";

export default class extends WebSocketController {
    @event("/demo")
    index() {
        return "Hello, World!";
    }
}
```

## Relations Between Event and Method

When a method is decorated with `@event`, this method is bound to a certain 
socket.io event. When a client emits data to this event, the method will be
automatically called, and the returning value will be sent back to the client
with proper forms.

### Set Up Namespace

By default, WebSocket events are bound to root namespace `/`, you can set static
property `nsp` to change it to another path.

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

## Signature of Methods

All methods bound to a unique event in the WebSocketController accept any number
of parameters, each one is corresponding to the data sent by the SocketIO client.

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

For more details, please check [Dependency Injection](./di3)

### Signature of the Constructor

All WebSocketController constructors accept one argument: `socket: WebSocket`.

```typescript
import { WebSocketController, WebSocket } from "sfn";

export default class extends WebSocketController {
    constructor(socket: WebSocket) {
        super(socket);
        
        // your stuffs...
    }
}
```

### Throw Status Exception In the Controller

Like in an HttpController, you can throw a `HttpException`, the framework will
handle it properly, and sending error response automatically.

```typescript
import { WebSocketController, HttpException, event } from "sfn";

export default class extends WebSocketController {
    @event("/example")
    example() {
        let well: boolean = false;
        let msg: string;
        // ...
        if (!well) {
            if (!msg)
                throw new HttpException(400); // => 400 bad request
            else
                throw new HttpException(400, msg); // => 400 with customized message
        }
    }
}
```

When a HttpException is thrown, the framework will always send a message that 
contains `{success: false, code, error}` to the client according to the 
specification of the controller method [error()](./http-controller#Common-API-Response).

## Bind Multiple Methods and Returns Many Values.

In a WebSocketController, if several methods are bound to the same event, these
methods will be called accordingly, and all returning values will be sent to the
client. Even multiple methods are bound, a controller will only be instantiated
once, `init()` and `destroy()` methods will also be called only once. However,
if an event is bound to multiple controllers, they will all be instantiated
accordingly, and their `init()` and `destroy()` methods will be called as
expected. And, if the method is a generator, any values `yield`ed by it will be
sent as well. that means you can use a generator to send data continuously.

```typescript
import { WebSocketController, WebSocket, event } from "sfn";

export default class extends WebSocketController {
    @event("generator-example")
    async *index(socket: WebSocket) {
        let i = 0;

        while (true) {
            yield i++; // the client will receive 1, 2, 3...10 continuously.

            if (i === 10) {
                break;
            }
        }
    }
}
```

## Customize Adapter

SFN uses SocketIO to ship WebSocket service, so you can use any features that 
SocketIO supports, the default WebSocket session data stored in memory, which 
has some disadvantages, e.g. online user session are not shared between 
processes, and when rebooting the process the user states will get lost. So it's
recommended to use extra adapters, e.g. 
[socket.io-redis](https://www.npmjs.com/package/socket.io-redis), the benefits 
of using Redis I won't cover here, you can check it out yourself.

```typescript
// <SRC_PATH>/bootstrap/websocket.ts
import { ws } from "sfn";
import * as RedisAdapter from "socket.io-redis";

ws.adapter(RedisAdapter({ host: "localhost", port: 6379 }));
```
