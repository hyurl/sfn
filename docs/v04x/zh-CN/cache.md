<!-- title: 缓存; order: 12 -->
# 基本概念

自 0.4 版本起，SFN 使用 [cluster-storage](https://github.com/hyurl/cluster-storage)
来进行数据缓存，它是一个能够在 NodeJS 集群中共享和自动同步数据的存储工具，并且支持数据备份和 
PM2 进程管理器，其数据存储于本地内存，无须等待异步操作。

# 如何使用？

## 配置

默认地，你无须进行任何配置并可使用缓存，但如果确实需要配置，或者增加更多的缓存实例，则只需要在
服务类中配置 `cacheOptions` 属性即可，下面的配置是默认的：

```typescript
class Service {
    cacheOptions = {
        name: "sfn",
        path: ROOT_PATH + "/cache",
        gcInterval: 120000
    }
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

更多关于 **cluster-storage** 的细节，例如配置和 API，可以
[在 GitHub 上查阅它](https://github.com/hyurl/sfn-cache)。

但如其文档所指出的，cluster-storage 仅适合缓存数据量不大的情况，对于缓存数据大的情景，最好
还是搭配 Redis 比较合适，为此，SFN 也专门提供了一个简单的 Redis 缓存封装
[sfn-cache](https://github.com/hyurl/sfn-cache)。