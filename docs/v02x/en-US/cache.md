<!-- title: Cache; order: 12 -->
# Concept

[sfn-cache](https://github.com/hyurl/sfn-cache) is a very simple cache tool 
based on Redis.

# How To Use?

## Configuration

First you need to connect to a Redis server, modify the configurations in the 
`config.ts`, just like this:

```typescript
export default <SFNConfig>{
    // ...
    redis: {
        host: "localhost",
        port: 6379
    }
    // ...
}
```

## Example

Then you can use the `cache` object in a service. You may have seen the 
example in the [Service](./service) page, here I will show it again.

```typescript
import { Service } from "sfn";
import { User } from "modelar";

export class MyService extends Service {

    async getUser(id: number): User {
        let user: User = null;

        try {
            let data = await this.getFromCache(id);

            if (data) {
                user = (new User).assign(data);
            } else {
                user = <User>await User.use(this.db).get(id);
                await this.cache.set(`user:${id}`, user.data);
            }

            this.logger.log(`Getting user (id: ${id}, name: ${user.name}) succeed.`);
        } catch (err) {
            this.logger.error(`Getting user (id: ${id}) failed: ${err.message}.`);
        }

        return user;
    }

    async getFromCache(id: number): object {
        let data: object = null;

        try {
            data = await this.cache.get(`user:${id}`);
        } catch (err) { }

        return data;
    }
}

let srv = new MyService;

(async () => {
    let user = await srv.getUser(1);
    // ...
})();
```

More details about the **sfn-cache**, e.g. configuration and API, please 
[view it on GitHub](https://github.com/hyurl/sfn-cache).