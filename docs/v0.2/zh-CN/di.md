<!-- title: 依赖注入; order: 18 -->
# 基本概念

要使你的应用更加强劲，SFN 引入了 **依赖注入** 的概念，一如既往地，它非常简单。

要使用这个技术，你将需要安装一个额外的模块，
[injectable-ts](https://github.com/hyurl/injectable-ts)。

## 示例

```typescript
// <SRC_PATH>/services/MyService.ts
import { Service } from "sfn";
import { injectable } from "injectable-ts";

@injectable
export class MyService extends Service {
    // ...
}
```

```typescript
// <SRC_PATH>/services/MyController.ts
import { HttpController } from "sfn";
import { injected } from "injectable-ts";
import { MyService } from "../services/MyService";

export class MyController extends HttpController {
    @injected
    service: MyService;

    async index() {
        // actually, `service.cache` is auto-injected as well.
        await this.service.cache.set("name", "Some Name");
        // ...
    }
}
```

这个例子展示了一点点 [injectable-ts](https://github.com/hyurl/injectable-ts) 的
知识，它能做的不止这些，例如，传递参数等，请前往 GitHub 并学习更多关于它的知识。

## 在控制器中自动注入

当处理控制器时，HttpController 和 WebSocketController 都支持自动注入特性，也就是，当
调用一个处理器方法时，定义在其签名中的依赖能够基于客户端传递的数据，被自动注入到方法中。

### HttpController 中的注入

在 HttpController 中，这个特性支持继承自 `modelar.Model` 的类，以及 `Request` 和
`Response` 接口。

同时，你还可以直接把 URL 参数设置为方法的参数，它们也会被注入。

```typescript
import { HttpController, Request, Response, route } from "sfn"
import { User } from "modelar";

export default class extends HttpController {
    @route.get("/user/get/:id")
    async getUser(req: Request, res: Response) {
        // This example only for tutorial, `res` is not actually in use.
        var user = await User.get<User>(req.params.id);
        return user;
    }

    @route.get("/user/get/:id")
    async getUserById(id: number) {
        // `id` will be auto-converted to number since it's declared as a number
        var user = await User.get<User>(id);
        return user;
    }

    @route.get("/user/get/:name")
    async getUserByName(name: string) {
        var user = await User.where<User>("name", name).get();
        return user;
    }

    @route.get("/user/get/:id")
    async getUserDirectly(user: User) {
        // user will be auto-fetched from the database according to the given 
        // `id`, this feature only support modelar models, and must provide the 
        // param `id`.
        return user;
    }

    @route.post("/user/create")
    async createUser(req: Request, user: User) {
        user.assign(req.body);
        await user.save();
        return user;
    }
}
```

### WebSocketController 中的注入

而在一个 WebSocketController 中，由于 WebSocket 发送和接收数据的方式和 HTTP 有些不同，
因此它仅支持唯一的 `WebSocket` 接口，而其他的参数，则可以直接从客户端发送过来。

```typescript
import { WebSocketController, WebSocket, event } from "sfn"
import { User } from "modelar";

export default class extends HttpController {
    @event("get-user")
    async getUser(socket: WebSocket, id: number) {
        var user = await User.use(socket.db).get<User>(id);
        return user;
    }

    @event("create-user")
    async createUser(data: object) {
        var user = new User(data).use(this.db);
        await user.save();
        return user;
    }

    @event("get-or-create")
    async createIfNotExists(id: number, data: object) {
        var user: User;
        try {
            user = await User.use<User>(this.db).get(id);
        } catch (err) {
            if (err.name == "NotFoundError") {
                user = new User(data).use(this.db);
                await user.save();
            } else {
                throw err;
            }
        }
        return user;
    }
}
```