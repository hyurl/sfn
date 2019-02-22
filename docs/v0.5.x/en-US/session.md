<!-- title: Session; order: 8 -->
# Concept

Session is enabled by default in **SFN** framework, and shared between HTTP 
and WebSocket. the framework uses 
[express-session](https://www.npmjs.com/package/express-session) to back 
session support.

## Configuration

You can modify `config.ts` to set proper configurations for your own session
needs, the following example shows how to configure 
[session-file-store](https://www.npmjs.com/package/session-file-store) as the 
storage engine.

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

Also, you can change to other available storage engine if you want to.

## Share State Between HTTP and WebSocket

This feature is very important in **SFN** framework, session sharing allows 
you changing the state in one end and affecting the other without doing 
repeated work, it guarantees that once you logged in from a HTTP request, 
and your WebSocket will be logged in as well (and vice versa).

## How To Use?

The `session` property is bound to the `req` and `socket` object in a 
controller (and in the middleware of [webium](https://github.com/hyurl/webium) 
and [socket.io](https://socket.io)), it's very the same that 
[express-session](https://www.npmjs.com/package/express-session) had told you, 
you must have a look at this module if you're not familiar with it.

In the HTTP end, the session will be automatically saved when the response 
channel is closed, but in the WebSocket end, for efficiency concerns, the 
framework won't save the the session automatically, you must do it yourself, 
just like this:

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