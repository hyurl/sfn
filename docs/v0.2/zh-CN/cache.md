<!-- title: 缓存; order: 12 -->
# 基本概念

[sfn-cache](https://github.com/hyurl/sfn-cache) 是一个非常简单的基于 Redis 的
缓存工具。

# 如何使用？

## 配置

首先你需要连接到一个 Redis 服务器，修改 `config.ts` 中的配置，就像这样：

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

## 示例

然后你就可以在服务中使用 `cache` 对象了，你可能已经在 [Service](./service) 页面中
看到过了这个示例，这儿我再展示一遍。


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

更多关于 **sfn-cache** 的细节，例如配置和 API，请
[在 GitHub 上查阅它](https://github.com/hyurl/sfn-cache)。