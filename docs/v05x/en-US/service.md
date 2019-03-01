<!-- title: Service; order: 10 -->
# Concept

The `Service` class is the base class in **SFN**, classes like 
`HttpController`, `WebSocketController` is inherited from it. It provides some
useful features like `i18n`, `logger`, `cache` that you can use to do real 
jobs.

# How To Use?

The `Service` class, inherited from `EventEmitter`, so does usage, you can 
define a new class then extends Service, or just use it directly. As 
convenience, you should put your service files in the `src/services/` 
directory.

## Example

### Use Service Directly

```typescript
import { Service } from "sfn";
import { User } from "modelar";

var srv = new Service;

(async (id: number) => {
    try {
        let user = <User>await User.use(srv.db).get(id);
        srv.logger.log(`Getting user (id: ${id}, name: ${user.name}) succeed.`);
        // ...
    } catch (e) {
        srv.logger.error(`Getting user (id: ${id}) failed: ${e.message}.`);
    }
})(1);
```

### Define A New Service Class

You can define a new service class to store the procedure of some frequently
used functions.

```typescript
// src/services/myService.ts
import { Service } from "sfn";
import { User } from "modelar";

declare global {
    namespace app {
        namespace services {
            const myService: ModuleProxy<MyService>;
        }
    }
}

export default class MyService extends Service {
    async getUser(id: number): User {
        let user: User = null;

        try {
            let data = this.cache.get(`user[${id}]`);

            if (data) {
                user = (new User).assign(data);
            } else {
                user = <User>await User.use(this.db).get(id);
                this.cache.set(`user.${id}`, user.data);
            }

            this.logger.log(`Getting user (id: ${id}, name: ${user.name}) succeed.`);
        } catch (err) {
            this.logger.error(`Getting user (id: ${id}) failed: ${err.message}.`);
        }

        return user;
    }
}
```

And then at where you need, use namespace to access the instance of this service.

```typescript
(async () => {
    let user = await app.services.myService.instance().getUser(1);
    // ...
})();
```

# Separating Services

The framework [Alar](https://github.com/hyurl/alar) that SFN uses allows 
services being separated and called as RPC procedures, so that to reduce the 
pressure of the web server, and improve the stability. This mechanism is also 
used to easily build a distributed service system.

To separate the services, you just need to do some simple configurations.

```typescript
// src/config.ts
export default <SFNConfig>{
    server: {
        rpc: {
            "rpc-server-1": {
                host: "127.0.0.1",
                port: 8081,
                modules: [app.services.myService]
            }
        }
    }
}
```

Then create a new file named `rpc-server-1.ts` and save it in `src/`, the 
contents would be like this:

```typescript
// src/rpc-server-1.ts
import "sfn";

app.rpc.serve("rpc-server-1");
```

Compile it and use command `node dist/rpc-server-1` to start the individual 
service, and use the `connect()` method to connect to the RPC server (You can 
also use `connectAll()` method to connect all the servers at once.):

```typescript
app.rpc.connect("rpc-server-1");
```

Then all the reference to the service will be redirected to this remote server,
basically you don't have to change any existing code. But be aware that all the 
properties will not be accessible remotely, and all methods will be wrapped in
Promise.

# Inner-Service Communication

What I'm about to say, is not about the IPC/RPC scheme that remote methods work
inside, instead, it's the about how the services are communicated with each 
other. e.g. one obvious problem is, the front end web server can push message to
browser clients via WebSocket, but the RPC server works in the background cannot 
communicate with clients directly.

To solve the problem of inner-service communication, SFN integrated a massage 
channel based on RPC socket, via a message queue named `MessageChannel`, the 
system can broadcast messages using a **pub-sub** model, and any service process
subscribes the event, the message can be received by its listeners.

By default, you don't have to create the instance of MessageChannel, SFN 
exporting it is just for type usage, to access the integrated message queue, you
just need to use the `app.message` interface.

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
packed doesn't run on a specific server, it's distributed and exists on every
individual RPC server, any other services connected to the RPC server can 
subscribe its events. Which means, not every service could receive the messages
published by the MessageChannel. In the above example, rpc-server-2 must connect
to rpc-server-1 for receiving the `greeting` event.

## Push WebSocket Message in an RPC Service

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

Except the above examples, other features like `of(nsp: string)`, `volatile`, 
`local`, `binary()` are also available.

`app.message.ws` not only can be used in the RPC server, but also can be used
in the web server (e.g. in a controller), also the service may be run locally, 
so for consistency, its recommended to push any message via `app.message.ws`.