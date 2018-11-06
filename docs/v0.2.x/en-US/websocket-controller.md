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

### Compatible In JavaScript

If you're programming in pure JavaScript, there is no decorators (not yet). 
But the framework support a compatible way of doing this, by using a **jsdoc**
block with an `@event` tag. You must turn on `enableDocRoute` in `config.js` 
first before using this feature. The following example works the same as the 
above one.

```javascript
// config.js
exports.default = {
    // ...
    enableDocRoute: true,
    // ...
};
```

```javascript
// src/controllers/Demo.js
const { WebSocketController } = require("sfn");

exports.default = class extends WebSocketController {
    /**
     * @event /demo
     */
    index() {
        return "Hello, World!";
    }
}
```

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

For more details, please check [Dependency Injection](./di3

### The Constructor

Some times you may want to do something before the actual method is called, 
you want to initiate some configurations before the class is instantiated, you
want to customize the `constructor` of the class. So this is how:

```typescript
import { WebSocketController, WebSocket } from "sfn";

export default class extends WebSocketController {
    constructor(socket: WebSocket) {
        super(socket);
        
        // your stuffs...
    }
}
```

### A Tip of WebSocket

`WebSocekt` is a TypeScript interface, actually there are a lot of interfaces 
(and alias `type`s) in **SFN**, they are not class, so can't be instantiated, or 
check `instanceof`, if you have any of these code in your application, you 
just got yourself troubles.

```typescript
// This example is wrong and should be avoid.

var obj = new WebSocket;

if (obj instanceof WebSocket) {
    // ...
}
```

Interfaces (and types) are not exported in JavaScript as well, so this code is
also incorrect.

```javascript
const { WebSocket } = require("sfn"); // WebSocket would be undefined.
```

### Throw SocketError In the Controller

`SocketError` is a customized error class that safe to use when you're going 
to response an error to the client. when a SocketError is thrown, then 
framework will handle it properly, and sending error response automatically.

`SocketError` is much the same as `HttpError`, so using HTTP error code is 
very common with the SocketError.

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

When a SocketError is thrown, the framework will always send a message that 
contains `{success: false, code, error}` to the client according to the 
specification of the controller method [error()](./http-controller#Common-API-Response).

## Customize Adapter

SFN uses SocketIO to ship WebSocket service, so you can use any features that 
SocketIO supports, the default WebSocket session data stored in memory, which 
has some disadvantages, e.g. online user session are not shared between 
processes, and when rebooting the process the user states will get lost. So it's
recommended to use extra adapters, e.g. 
[socket.io-redis](https://www.npmjs.com/package/socket.io-redis), The benefits 
of using Redis I won't cover here, you can check it out yourself.

```typescript
// <SRC_PATH>/bootstrap/websocket.ts
import { ws } from "sfn";
import * as RedisAdapter from "socket.io-redis";

ws.adapter(RedisAdapter({ host: "localhost", port: 6379 }));
```

## WebSocketController and Service

A controller is actually a service, you can use any features that works in 
[Service](./service) in a controller.