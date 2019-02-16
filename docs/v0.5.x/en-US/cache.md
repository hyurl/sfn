<!-- title: Cache; order: 12 -->
# Concept

Since version 0.4, SFN uses
[cluster-storage](https://github.com/hyurl/cluster-storage) to store cache data,
which is a tool that can share and auto-sync data in NodeJS cluster, and with 
support of data backup and PM2 process management, it stores data in local 
memory, and no need to wait async operations.

# How To Use?

## Configuration

By default, you don't have to do any configuration before using the cache, but 
if you need, or you want to create more cache instance, you just need to set the
property `cacheOptions` in the service class. The following example shows the 
default config.

```typescript
class Service {
    cacheOptions = {
        name: "sfn",
        path: ROOT_PATH + "/cache",
        gcInterval: 120000
    }
}
```

## Example

You can, whenever you want, use the `cache` object in a service. You may have 
seen the example in the [Service](./service) page, here I will show it again.

```typescript
import { Service } from "sfn";
import { User } from "modelar";

export class MyService extends Service {
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

let srv = new MyService;

(async () => {
    let user = await srv.getUser(1);
    // ...
})();
```

For more details about **cluster-storage**, like configurations and API, you can
[view it on GitHub](https://github.com/hyurl/sfn-cache)。

And as what it has suggested, cluster-storage is only for situations with small 
amount of data, for large amount of data, it's better company with Redis, and 
for that, SFN also provides a simple Redis cache wrapper, 
[sfn-cache](https://github.com/hyurl/sfn-cache)。