<!-- title: HTTP 控制器; order: 3 -->
## 基本概念

`HttpController` 处理来自 HTTP 客户端的请求，它本质是一个继承自
[Service](./service) 的扩展类，但和服务的单例模式不同，控制器属于一次性用品，一个
实例会在客户端请求到达时被创建，请求完成后被销毁。因此，控制器也重载了一些基类的
方法来使它适应这种独特的运行模式，而又能够保持与普通服务相似的开发体验。

## 使用示例

你只需要在 `src/controllers` 目录下创建一个文件，并且这个文件导出一个默认的类，
它继承于 `HttpController`，然后它就可以在服务器启动时被自动加载。


```typescript
import { HttpController, route } from "sfn";

export default class extends HttpController {
    @route.get("/demo")
    async index() {
        return "Hello, World!";
    }
}
```

## 路由和方法之间的关系

当一个方法被 `@route` 修饰时，这个方法就会被绑定到一个确定的 URL 路由上。当访问
一个匹配路由的URL 地址时，这个方法就会被自动地调用，其返回值将会以合适的形式返回
给发起请求的客户端。

装饰器 `route` 是一个函数及命名空间。当作为函数调用时，它支持这些形式：

- `route(routeStr: string)` e.g. `route("GET /demo")`
- `route(httpMethod: string, path: string)` e.g. `route("GET", "/demo")`

当作为命名空间使用时，它包含了下面的这些函数，每一个都对应着相应的 HTTP 请求方法。

- `route.delete(path: string)`
- `route.get(path: string)`
- `route.head(path: string)`
- `route.patch(path: string)`
- `route.post(path: string)`
- `route.put(path: string)`
- `route.sse(path: string)` SSE 使用的是 GET 方式，并由客户端的 EventSource 来连接。

### 路由格式

框架使用 [path-to-regexp](https://github.com/pillarjs/path-to-regexp) 来解析 URL 
路由，这里我只会给你一些常用的用法以加深你对路由的印象，关于更多的细节，你需要
自己去查阅该模块的文档。

```typescript
import { HttpController, Request, route } from "sfn";

export default class extends HttpController {
    /**
     * Common URL path
     * GET /user
     */
    @route.get("/user")
    async index() { }

    /**
     * The ':' indicates a URL parameter.
     * This route path will match /user/1, /user/2, /user/3, and so on.
     */
    @route.get("/user/:id")
    async getUser(req: Request) {
        return req.params.id; // => 1
    }

    /**
     * The '?' indicates the parameter is optional.
     * This route path will match /user/1, /user/1/edit, and so on.
     */
    @route.get("/user/:id/:action?")
    async getUser2(req: Request) {
        return {
            id: req.params.id, // => 1
            action: req.params.action // => undefined or any strings provided.
        };
    }

    /**
     * The '+' indicates one or more parameter matches
     * This route path will match any URL that starts with /user/, 
     * e.g /user/, /user/1, /user/1/edit, and so on.
     */
    @route.get("/user/:path+")
    async getUser3(req: Request) {
        return req.params.path; // => '', 1, 1/edit, etc.
    }

    /**
     * The '+' indicates one or more parameter matches
     * This route path will match any URL that starts with /user, 
     * e.g /user, /user/, /user/1, /user/1/edit, and so on.
     */
    @route.get("/user/:path*")
    async getUser4(req: Request) {
        return req.params.path; // => undefined, '', 1, 1/edit, etc.
    }
}
```

### 设置 baseURI

默认地，路由被绑定到根路径 `/`，你可以设置静态属性 `baseURI` 将其修改为其他路径。

```typescript
export default class extends HttpController {
    static baseURI = "/api";

    /**
     * @example GET /api/user/1
     */
    @route.get("/user/:uid")
    async getUser(uid: number) {
        // ...
    }
}
```

## 方法的签名

从上面的例子中，你可以看到我传递了一个 `uid: number` 到绑定到路由的方法中。实际上，
你可以做得更多，请查看章节 [依赖注入](./di#在控制器中自动注入).

### 构造函数签名

所有 HttpController 的构造函数都接受两个参：`req: Request` 和 `res: Response`。

```typescript
import { HttpController, Request, Response } from "sfn";

export default class extends HttpController {
    constructor(req: Request, res: Response) {
        super(req, res);
        // your stuffs...
    }
}
```

## 前置和后置操作

和服务中一样，你可以重载 `init()` 和 `destroy()` 方法，来对控制器进行初始化和销毁
操作。

(**注意:** 在 v0.6 之前，这些方法被命名为 `before()` 和 `after()`，他们现在已经
被废弃，因为新的 方法名和服务更加一致。)

```typescript
import * as fs from "fs";
import { HttpController, Request, Response, route } from "sfn";
import * as util from "util";

const readFile = util.promisify(fs.readFile);

export default class extends HttpController {
    txtData: string;

    async init() {
        await super.init();
        this.txtData = await readFile("example.txt", "utf8");
    }

    async destroy() {
        await super.destroy();
        // This method is just for example, it's not necessary here, but 
        // sometimes you should define it and say, close database connections in 
        // it.
        this.txtData = void 0;
    }

    @route.get("/example")
    async example() {
        return this.txtData;
    }
}
```

更高级的方案，请查看 [面向切面编程](./mixins-aop#面向切面编程)。

## 使用异步语义

在面向网络编程时，使用异步函数都是受到推荐的，即使你的方法体中没有任何异步操作，
因为这些方法被通过网络(异步 IO) 调用，因此使用 `async` 修饰符会让它们看起来更
符合语义（当然这只是推荐的做法，并不是必须的）。

但如果你的代码中使用的某些异步的函数、第三方包不支持 `Promise`，则可以使用 
`util.promisify()` 函数来将其包装成 Promise (或者自己写一个 Promise)，请看下面的
示例：

```typescript
import { HttpController, Request, Response, route } from "sfn";
import * as fs from "fs";
import * as util from "util";

const fileExists = util.promisify(fs.exists),

export default class extends HttpController {
    @route.get("/check-file")
    async checkFile() {
        if (await fileExists("somefile")) {
            return this.success("File exists!");
        } else {
            return this.error("File doesn't exist!");
        }
    }
}
```

## 抛出状态异常

`StatusException` 是一个由框架定义的异常类，你可以在想要响应一个 HTTP 错误到客户端
时使用它。当一个 StatusException 被抛出时，框架将会对其进行合适的处理并自动地发送
错误响应内容。

```typescript
import { HttpController, StatusException, route } from "sfn";

export default class extends HttpController {
    @route.get("/example")
    async example() {
        let well: boolean = false;
        let msg: string;
        // ...
        if (!well) {
            if (!msg) {
                throw new StatusException(400); // => 400 bad request
            } else {
                // => 400 with customized message
                throw new StatusException(400, msg);
            }
        }
    }
}
```

框架会检查客户端所接受的响应类型，并用合适的方式发送错误信息。通常地，一个普通的
HTTP 错误页面会被返回。但如果在请求头中出现了 `Accept: application/json`，一个
状态码为 `200` 并携带 JSON 信息 `{success: false, code, error}` 的响应将会被返回，
这个响应形式来自于控制器方法 [error()](./http-controller#通用-API-响应).。

如果这个响应头没有出现，那么框架会检查是否在 `src/views/` 目录中存在着一个名称和
错误代码对应的模板（如 `404.html`）。如果文件存在，那它将会被发送为错误页面，否则，
一个简单的错误响应将会被返回。

## 自定义错误页面

默认地，框架会根据错误代码发送一个对应的视图文件，并且仅传递 `err: StatusException` 
对象到模板中，它可能并不满足一些复杂的需求。因此，框架允许你自定义错误处理器，
通过重写静态方法 `HttpController.httpErrorView` 来实现。下面的示例将向你展示如何做。

```typescript
// src/bootstrap/http.ts
import { HttpController } from "sfn";

HttpController.httpErrorView = function (err, instance) {
    let vars = {
        err,
        title: err.toString(),
        copyRight: "&copy; " + (new Date).getFullYear() + " My Website.",
        // ...
    };
    return instance.view(String(err.code), vars);
}
```

## 通用 API 响应

无论是在一个 HttpController 中，或 WebSocketController 中，你都总是可以使用方法 
`success()` 和方法 `error()` 来发送一个结构化的响应，来表示一个成功或者失败的操作。

```typescript
import { HttpController, route } from "sfn";
import { User, NotFoundError } from "modelar";

export default class extends HttpController {

    @route.post("/login")
    async login(req: Request) {
        try {
            let email = req.body.email,
                password = req.body.password,
                user = await User.use(this.db).login({ email, password });

            req.session.uid = user.id;

            return this.success(user);
            // { success: true, code: 200, data: user }
        } catch (err) {
            return this.error(err, err instanceof NotFoundError ? 404 : 500);
            // { success: false, code: 404 | 500, error: err.message }
        }
    }
}
```

## 绑定多个方法与返回多个值

在 HTTP 控制器中，如果多个方法被绑定到了同一个路由上，那么这些方法将会按照其定义
的顺序被依次调用，除了 SSE，其他请求模式下， 只有第一个有效的返回值（不为 
`undefined`）会被发送给客户端。即使绑定了多个方法，一个控制器也只会被实例化一次，
`init()` and `destroy()` 方法也只会被调用一次，但如果路由绑定在了多个控制器内，
那么这些控制器都会被依次实例化，并且调用其 `init()` 和 `destroy()` 方法。

如果所绑定的是一个 SSE 路由，那么所有被绑定方法的返回值都会被依次发送给客户端。
并且，如果方法是一个生成器，那么该方法所 `yield` 的值也会被依次发送。因此，你也
可以使用生成器来持续地向客户端返回数据。

```typescript
import { HttpController, Request, Response, route } from "sfn";

export default class extends HttpController {
    @route.sse("/generator-example")
    async *index(req: Request, res: Response) {
        let i = 0;

        while (true) {
            yield i++; // the client will receive 1, 2, 3...10 continuously.

            if (i === 10) {
                break;
            }
        }
    }
}
```
