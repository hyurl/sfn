<!-- title: Service; order: 2.1 -->
# Concept

In a distributed system, **Service** is the most basic and most important 
concept. Since v1.0, SFN now included a new RPC engine that is called
[Microse](https://github.com/microse-rpc/microse-node), which provides a simple
however efficient development scheme for distributed service. During the
development process, you will scarcely notice that you're working on a
distributed system, every development task could be done on a single machine,
and when deployed, it is very easy to separate services, to run them across
networks.


## Create a New Service

Write a new service file, store it under `src/services/` directory, ensure the 
filename consists of the variable name under the namespace. Let's look at this
simple cache service example bellow.

```typescript
// src/services/cache.ts
import * as fs from "fs-extra";
import get = require("lodash/get");
import has = require("lodash/has");
import set = require("lodash/set");
import unset = require("lodash/unset");
import { ModuleProxy } from "microse";

declare global {
    namespace app {
        namespace services {
            const cache: ModuleProxy<CacheService>;
        }
    }
}

export default class CacheService {
    protected cache: { [path: string]: any } = {};
    protected filename = app.ROOT_PATH + "/cache/cache-service.json";

    async init() {
        try {
            let data = await fs.readFile(this.filename, "utf8");
            this.cache = JSON.parse(data);
        } catch (e) { }
    }

    async destroy() {
        let data = JSON.stringify(this.cache);
        await fs.writeFile(this.filename, data, "utf8");
    }

    async get<T>(path: string) {
        return get(this.cache, path);
    }

    async has(path: string) {
        return has(this.cache, path);
    }

    async set<T>(path: string, data: T) {
        return set(this.cache, path, data);
    }

    async delete(path: string) {
        return unset(this.cache, path);
    }
}
```

And then wherever you need, use the namespace to access the instance of this
service.

```typescript
(async () => {
    await app.services.cache.set("something", "This is a test");
    // ...
})();
```

For more examples about service, please check the 
[source code](https://github.com/hyurl/sfn/tree/master/src/services) of this 
website.

## Distributed Services

The microse engine allows services being separated and called as RPC procedures
as simple as it can, to reduce the pressure of the web server and improve the
stability. This mechanism is used to easily build the distributed service system
inside SFN.

To distribute the service, you just need to add some simple configurations.

```typescript
// src/config.ts
export default <app.Config>{
    server: {
        rpc: {
            "cache-server": {
                host: "localhost",
                port: 4004,
                services: [app.services.cache]
            }
        }
    }
}
```

Compile the program and use the following command to start the new server.

```sh
node dist cache-server # cache-server is the id set as a key in app.config.server.rpc
```

## Service Dependencies

After starting the cache service via the above command, the web server
(including HTTP and WebSocket) will be able to redirect all traffics to this
service to the new server, basically you don't have to alter any code (BUT
remember not all properties are supported, and the methods will all become
asynchronous).

However, if you want another service running in another RPC server to be able to
access this service, then you need to config service dependencies for that RPC
server, just like this:

```typescript
// src/config.ts
export default <app.Config>{
    server: {
        rpc: {
            "doc-server": {
                host: "localhost",
                port: 4001,
                services: [app.services.docs],
                dependencies: [app.services.cache]
            }
        }
    }
}
```

Then all programs run in doc-server, when calling `app.services.cache`, will be
able to redirect all their traffics to the server that ships this service (no
matter how many servers are configured to ship this service).

The different designs between web server and RPC server, are because, usually,
the web server requires more back-end services (especially for web applications).
And an RPC service will less likely rely on another RPC service, usually, only
a few functions are required. Of course, if you do not know which service might
be needed or not, you can directly set the `dependencies` option to `all`, in
order to connect all RPC services.

## Basic Service

For convenience, the framework integrated with a basic `Service` class, which
contains some useful methods, e.g. `i18n`, `throttle`, `queue`. The developer
can use them to achieve relevant functions, just inherit this service when
creating a new service.

```ts
import { Service } from "sfn";

export default class MyService extends Service {
    throttledOps(...args: any[]) {
        return this.throttle("a unique key", async () => {
            return this.i18n("This method can only be called once for every second");
        }, 1000);
    }

    queuedOps(...args: any[]) {
        return this.queue("a unique key", async () => {
            return this.i18n("All calls to this method will be queued up");
        });
    }
}
```

In fact, HTTP controller and WebSocket controller are also based on this basic 
service, which will be mentioned afterward.

## Service Initiation and Destruction

SFN v1 ships with microse, which provides the ability to support life cycle
controls of the service. When running distributed, if a service has an `init()`
method, then it will be invoked on the start-up, in order to perform initiation
for the service， for example, connecting to a database. BUT it should be aware
that this feature only works with the services that were served as RPC services.

Just like the initiation, if a service has a `destroy()` method, it will be
called when the system shuts down, in order to release resources, do garbage
collection, etc.

The basic `Service` class already includes these methods, in order to perform
some elementary tasks, for instance, the auto garbage collection for internal
data. If an extended class needs to override these methods, it should call
the parent method inside the new method.

```ts
import { Service } from "sfn";

export default class MyService extends Service {
    async init() {
        await super.init();
        // ...
    }

    async destroy() {
        await super.destroy();
        // ...
    }
}
```

## Customize Garbage Collection

As pointed out above, the basic `Service` class contains an internal garbage
collector, and of course an extended class can use and extend this method to
clean custom data periodically. To do so, just override the `gc()` method like
this:

```ts
import { Service } from "sfn";

export default class MyService extends Service {
    protected async gc() {
        await super.gc(); // make sure the parent's gc is called.
        // ...
    }
}
```

The timing of invoking `gc()` is decided by an internal timer, however, when
`destroy()` is called, the `gc()` will always be called alongside.

## Cross Language Support

Microse is an RPC engine that support multiple programming languages, which
means that your service written in SFN can also be called from other programs in
other languages (or the other way around), for example, you can use the
above Cache service in a Python program:

```py
from microse.app import ModuleProxyApp
import asyncio

app = ModuleProxyApp("app")

async def main():
    client = app.connect("ws://localhost:4001")
    client.register(app.services.cache)

    await app.services.cache.set("something", "This is a test")

    cache = await app.services.cache.get("something") # This is a test

    client.close()

asyncio.get_event_loop().run_until_complete(main())
```

For more information about microse, please visit its
[GitHub page](https://github.com/microse-rpc).
