<!-- title: Dependency Injection; order: 18 -->
# Concept

Since SFN 0.5.x introduced Alar framework to auto-load and hot-reload modules, 
traditional Dependency Injection support is no longer suggested, so here I only
list out the DI specifications of controllers.

## Auto-Injection in Controllers

When dealing with controllers, both HttpController and WebSocketController 
support the feature of auto-injection, which is, when invoking a handler method,
the dependencies declared in its signature will be auto-injected according to 
the given data sent by the client.

### Injection in HttpController

In HttpController, this feature supports the interfaces `Request`, `Response`
and `Session`.

At the mean time, you can directly set the URL parameters as the parameters 
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
        // `id` will be auto-casted to number since it's declared as a number
        var user = await User.get<User>(id);
        return user;
    }

    @route.get("/user/get/:name")
    async getUserByName(name: string) {
        var user = await User.where<User>("name", name).get();
        return user;
    }
}
```

### Injection in WebSocketController

While in a WebSocketController, since the WebSocket sending and receiving data 
in a different way, so it only supports the interfaces `WebSocket` and
`Session`, and other arguments can be directly sent from the client.

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
