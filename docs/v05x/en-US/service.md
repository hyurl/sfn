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
properties will not be accessible remotely, and all methods will be asynchronous.