<!-- title: 服务; order: 10 -->
# 基本概念

`Service` 类是 **SFN** 框架中的基本类，其他类如 `HttpController`、
`WebSocketController` 都继承自它。它提供了一些有用的特性，如 `i18n`、`logger`、
`cache` 等，能够让你用来做真正的事情。

## 如何使用？

`Service` 类，继承自 `EventEmitter`，用法也相同，你可以定义一个新的类来扩展服务，
或者直接使用它。为了方便，你应该将你的服务文件存储在 `src/service/` 目录下。

### 示例

#### 直接使用 Service

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

#### 定义一个新的服务类

你可以定义一个新的服务类来存储一些常用功能的执行过程。

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