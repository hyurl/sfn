<!-- title: Service; order: 10 -->
# Concept

The `Service` class is the base class in **SFN**, classes like 
`HttpController`, `WebSocketController` is inherited from it. It provides some
useful features like `i18n`, `logger`, `cache` that you can use to do real 
jobs.

## How To Use?

The `Service` class, inherited from `EventEmitter`, so does usage, you can 
define a new class then extends Service, or just use it directly. As 
convenience, you should put your service files in the `src/services/` 
directory.

### Example

#### Use Service Directly

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

#### Define A New Service Class

You can define a new service class to store the procedure of some frequently
used functions.

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