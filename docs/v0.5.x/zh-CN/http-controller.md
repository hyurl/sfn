<!-- title: HTTP 控制器; order: 3 -->
# 基本概念

`HttpController` 处理来自 HTTP 客户端地请求。

# 如何使用？

你只需要在 `src/controllers` 目录下创建一个文件，并且这个文件导出一个默认的类，它继承于 
`HttpController`，然后它就可以在服务器启动时被自动加载。

## 示例

```typescript
import { HttpController, route } from "sfn";

export default class extends HttpController {
    @route.get("/demo")
    index() {
        return "Hello, World!";
    }
}
```

## 路由和方法之间的关系

当一个方法被 `@route` 修饰时，这个方法就会被绑定到一个确定的 URL 路由上。当访问一个匹配路由的
URL 地址时，这个方法就会被自动地调用，其返回值将会以合适的形式返回给发起请求的客户端。

装饰器 `route` 是一个函数及接口。当作为函数调用时，它支持这些形式：

- `route(routeStr: string)` e.g. `route("GET /demo")`
- `route(httpMethod: string, path: string)` e.g. `route("GET", "/demo")`

当作为接口使用时，它包含了下面的这些方法，每一个都对应着相应的 HTTP 请求方法。

- `route.delete(path: string)`
- `route.get(path: string)`
- `route.head(path: string)`
- `route.patch(path: string)`
- `route.post(path: string)`
- `route.put(path: string)`
- `route.sse(path: string)` SSE 使用的是 GET 方式，并由客户端的 EventSource 来实现。

如果多个方法被绑定到了同一个路由上，那么这些方法将会按照其定义的顺序被依次调用，除了 SSE，其他
请求模式下， 只有第一个有效的返回值（不为 `undefined`）会被发送给客户端。即使绑定了多个方法，
一个控制器也只会被实例化一次，`before()` and `after()`方法也只会被调用一次，但如果路由绑定
在了多个控制器内，那么这些控制器都会被依次实例化，并且调用其 `before()` 和 `after()` 方法。

### 路由格式

框架使用 [path-to-regexp](https://github.com/pillarjs/path-to-regexp) 来解析 URL 
路由，这里我只会给你一些常用的用法以加深你对路由的印象，关于更多的细节，你需要自己去查阅该模块的
文档。

```typescript
import { HttpController, Request, route } from "sfn";

export default class extends HttpController {
    /**
     * Common URL path
     * GET /user
     */
    @route.get("/user")
    index() { }

    /**
     * The ':' indicates a URL parameter.
     * This route path will match /user/1, /user/2, /user/3, and so on.
     */
    @route.get("/user/:id")
    getUser(req: Request) {
        return req.params.id; // => 1
    }

    /**
     * The '?' indicates the parameter is optional.
     * This route path will match /user/1, /user/1/edit, and so on.
     */
    @route.get("/user/:id/:action?")
    getUser2(req: Request) {
        return {
            id: req.params.id, // => 1
            action: req.params.action // => undefined or any strings provided.
        };
    }

    /**
     * The '+' indicates one or more parameter matches
     * This route path will macth any URL that starts with /user/, 
     * e.g /user/, /user/1, /user/1/edit, and so on.
     */
    @route.get("/user/:path+")
    getUser3(req: Request) {
        return req.params.path; // => '', 1, 1/edit, etc.
    }

    /**
     * The '+' indicates one or more parameter matches
     * This route path will macth any URL that starts with /user, 
     * e.g /user, /user/, /user/1, /user/1/edit, and so on.
     */
    @route.get("/user/:path*")
    getUser4(req: Request) {
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
    getUser(uid: number) {
        // ...
    }
}
```

## 方法的签名

从上面的例子中，你可以看到我传递了一个 `uid: number` 到绑定到路由的方法中。实际上，
你可以做得更多，请查看章节 [依赖注入](./di#在控制器中自动注入).

## 处理异步操作

当处理异步操作时，你可以使用修饰符 `async`，就像下面这样：

```typescript
import { HttpController, Request, Response, route } from "sfn";

export default class extends HttpController {
    @route.get("/")
    async index(req: Request, res: Response) {
        // you can use `await` here
    }
}
```

## 前置和后置操作

如果你想要在调用实际的方法前执行一些异步的操作，JavaScript 是不会允许你定义一个 
`async constructor()` 的，但不用担心，**SFN** 提供了一个简单的方式让你可以这么做。框架允许
你定义方法 `before()` 和 `after()` 来控制流程。

```typescript
import * as fs from "fs";
import { HttpController, Request, Response, route } from "sfn";
import * as util from "util";

const readFile = util.promisify(fs.readFile);

export default class extends HttpController {
    txtData: string;

    async before() {
        this.txtData = await readFile("example.txt", "utf8");
    }

    after() {
        // This method is just for example, it's not necessary here, but 
        // sometimes you should define it and say, close database connections in 
        // it.
        this.txtData = void 0;
    }

    @route.get("/example")
    example() {
        return this.txtData;
    }
}
```

更高级的方案，请查看 [面向切面编程](./aop-mixins#面向切面编程)。

### 处理非 Promise 过程

如果你的代码中使用的某些异步的函数、第三方包不支持 `Promise`，那么你就不能使用 
`await` 来处理它们，要处理这些异步的操作，你可以使用 `util` 模块中的 `promisify()` 函数来
将其包装成 Promise（NodeJS 版本高于 `8.0`），或者直接使用它们，然后在你想要返回数据给前端的
地方，直接调用 `res.send()` 方法即可。请看下面的示例：

```typescript
import { HttpController, Request, Response, route } from "sfn";
import * as fs from "fs";
import * as util from "util";

export default class extends HttpController {
    filename = "somefile";

    @route.get("/check-file")
    checkFile() {
        fs.exists(this.filename, exists => {
            if (exists) {
                res.send(this.success("File exists!"));
            } else {
                res.send(this.error("File doesn't exist!"));
            }
        });
    }

    @route.get("/check-file-promisify")
    async checkFilePromisify() {
        // require NodeJs higher than 8.0
        var fileExists = util.promisify(fs.exists),
            exists = await fileExists(this.filename);

        if (exists) {
            return this.success("File exists!");
        } else {
            return this.error("File doesn't exist!");
        }
    }
}
```

## 构造函数

有些时候你可能想要在真正的方法被调用前做一些事情，你可能想要进行一些额外的配置，在类被实例化前，
你想要自定义类的 `constructor`，就像下面这样：

```typescript
import { HttpController, Request, Response } from "sfn";

export default class extends HttpController {
    constructor(req: Request, res: Response) {
        super(req, res);
        // your stuffs...
    }
}
```

## 在控制器中抛出 HttpError

`HttpError` 是一个由框架定义的错误类，它是安全的，你可以在想要响应一个 HTTP 错误到客户端时
使用它。当一个 HttpError 被抛出时，框架将会对其进行合适的处理，并自动地发送错误响应内容。

```typescript
import { HttpController, HttpError, route } from "sfn";

export default class extends HttpController {
    @route.get("/example")
    example() {
        let well: boolean = false;
        let msg: string;
        // ...
        if (!well) {
            if (!msg)
                throw new HttpError(400); // => 400 bad request
            else
                throw new HttpError(400, msg); // => 400 with customized message
        }
    }
}
```

框架会检查客户端所接受地响应类型，并用合适的方式发送错误信息。通常地，一个普通的 HTTP 错误页面
会被返回。但如果在请求头中出现了 `Accept: application/json`，一个状态码为 `200` 并携带 
JSON 信息 `{success: false, code, error}` 的响应将会被返回，这个响应形式来自于控制器方法 
[error()](./http-controller#Common-API-response).。

如果这个响应头没有出现，那么框架会检查是否在 `src/views/` 目录中存在着一个名称和错误代码对应
的模板（如 `404.html`）。如果文件存在，那它将会被发送为错误页面，否则，一个简单的错误响应将会
被返回。

### 自定义错误页面

默认地，框架会根据错误代码发送一个对应的视图文件，并且仅传递 `err: HttpError` 对象到模板中，
它可能并不满足一些复杂的需求。因此，框架允许你自定义错误处理器，通过重写静态方法
`HttpController.httpErrorView` 来实现。下面的示例将向你展示如何做。

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

无论是在一个 HttpController 或着 WebSocketController 中，你都总是可以使用方法 
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

## HttpController 与服务

一个控制器实际上就是一个服务，你可以在一个控制器中使用任何在 [Service](./service) 中有效的
特性。