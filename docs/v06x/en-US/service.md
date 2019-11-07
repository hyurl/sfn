<!-- title: Service; order: 2.1 -->
# Concept

In a distributed system, **Service** is the most basic and most important 
concept. With the RPC ability that [Alar](https://github.com/hyurl/alar) 
framework gives, SFN provides the simplest however efficient development scheme 
of distributed service. During the development process, you will scarcely notice 
that you're working on a distributed system, every development task could be 
done on a single machine, and when deploy, it is very easy to separate services, to run them distributed.


## Create a New Service

Write a new service file, store it under `src/services/` directory, ensure the 
filename consists with the variable name under the namespace. Let's look at this
simple cache service example bellow.

(NOTE: `ModuleProxy` is a global interface from Alar framework, no need to 
import, just use it directly.)

```typescript
// src/services/cache.ts
import * as fs from "fs-extra";
import get = require("lodash/get");
import has = require("lodash/has");
import set = require("lodash/set");
import unset = require("lodash/unset");

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

And then wherever you need, use namespace to access the instance of this service.

```typescript
(async () => {
    await app.services.cache.instance().set("something", "This is a test");
    // ...
})();
```

For more examples about service, please check the 
[source code](https://github.com/hyurl/sfn/tree/master/src/services) of this 
website.

## Distributed Services

The framework [Alar](https://github.com/hyurl/alar) that SFN uses allows 
services being separated and called as RPC procedures, so that to reduce the 
pressure of the web server, and improve the stability. This mechanism is also 
used to easily build a distributed service system.

To separate the services, you just need to do some simple configurations.

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
node dist cache-server
```
