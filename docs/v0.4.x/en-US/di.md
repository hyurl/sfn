<!-- title: Dependency Injection; order: 18 -->
# Concept

To make your application even more stronger, SFN adopted the mechanism of 
**Dependency Injection**, and as usual, it is very easy to use.

To use this mechanism, you'll have to install another package named
[injectable-ts](https://github.com/hyurl/injectable-ts).

## Example

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

This example just shows you a little bit of 
[injectable-ts](https://github.com/hyurl/injectable-ts), it does more than that,
e.g. passing parameters, please go to GitHub and learn a little more about it.

## Auto-Injection in Controllers

When dealing with controllers, both HttpController and WebSocketController 
support the feature of auto-injection, which is, when invoking a handler method 
the dependencies declared in its signature will be auto-injected according to 
the given data sent by the client.

### Injection in HttpController

In HttpController, this feature supports the classes inherited from 
`modelar.Model`, and the interfaces `Request` and `Response`.

In an HttpController, you can directly set the URL parameters as the parameters 
of the method, and they will be injected as well.

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

### Injection in WebSocketController

While in a WebSocketController, since the WebSocket sending and receiving data 
in a different way from HTTP, so it only supports the only interface 
`WebSocket`, and other arguments can be directly sent from the client.

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