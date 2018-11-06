<!-- title: HTTP 控制器; order: 3 -->
# 基本概念

`HttpController` 处理来自 HTTP 客户端地请求。

# 如何使用？

你只需要在 `src/controllers` 目录下创建一个文件，并且这个文件导出一个默认的类，它
继承于 `HttpController`，然后它就可以在服务器启动时被自动加载。

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

当一个方法被 `@route` 修饰时，这个方法就会被绑定到一个确定的 URL 路由上。当访问一个
匹配路由的 URL 地址时，这个方法就会被自动地调用，其返回值将会以合适的形式返回给发起
请求的客户端。

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

### 兼容 JavaScript

如果你正在使用纯 JavaScript 来编程，它并不支持装饰器（尚未支持），但框架提供了一种
兼容的方式能够让你使用相似的特性，通过使用 **jsdoc** 注释块配合 `@route` 标签。你
必须先在 `config.js` 中打开 `enableDocRoute` 选项才能使用这个特性。下面这个示例和
上面的效果是一样的。

```javascript
// config.js
exports.default = {
    // ...
    enableDocRoute: true,
    // ...
};
```

```javascript
// src/controllers/Demo.js
const { HttpController } = require("sfn");

exports.default = class extends HttpController {
    /**
     * @route GET /demo
     */
    index() {
        return "Hello, World!";
    }
}
```

### 路由格式

框架使用 [path-to-regexp](https://github.com/pillarjs/path-to-regexp) 来解析 
URL 路由，这里我只会给你一些常用的用法以加深你对路由的印象，关于更多的细节，你需要
自己去查阅该模块的文档。

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

从上面的例子中，你可以看到我传递了一个 `req: Request` 到绑定到路由的方法中。实际上，
你可以做得更多，请查看章节 [依赖注入](./di#在控制器中自动注入).

### 在 JavaScript 中

由于 JavaScript 不支持类型标注，因此你不能在方法上设置参数（实际上可以，但只有部分效果），
因此与其将它们传递为参数，你可以在方法中从 `this` 对象来获取它们。

```javascript
const { HttpController } = require("sfn");

exports.default = class extends HttpController {
    /**
     * @route GET /
     */
    index() {
        let { req, res } = this;
        // ...
    }
}
```

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

### 在 JavaScript 中

无论你是使用 TypeScript 或者 JavaScript 编程，只要你的 NodeJS 版本高于 `7.6`，你都
总是可以使用 `async/await` 修饰符。但如果你是在版低于 `7.6` 的 NodeJS 环境中编程，
你可以使用另一个兼容的方案来实现这个功能。

编辑你的 `config.js` 文件，设置 `config.awaitGenerator` 为 `true`，然后你就可以
使用迭代器函数和 `yield` 来处理异步操作了，就像这样：

```javascript
// config.js
exports.default = {
    // ...
    awaitGenerator: true,
    // ...
};
```

```javascript
const { HttpController } = require("sfn");

exports.default = class extends HttpController {
    /**
     * @route GET /
     */
    * index() {
        // you can use `yield` here
    }
}
```

## 前置和后置操作

如果你想要在调用实际的方法前执行一些异步的操作，JavaScript 是不会允许你定义一个 
`async constructor()` 的，但不用担心，**SFN** 提供了一个特别的方式让你可以这么做。
框架允许你定义方法 `before()` 和 `after()` 来控制过程流。

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

更高级的用法，请查看 [面向切面编程](./aop-mixins#面向切面编程)。

### 处理非 Promise 过程

如果你的代码中使用的某些异步的函数、第三方包不支持 `Promise`，那么你就不能使用 
`await` 或者 `yield` 来处理它们，要处理这些异步的操作，你可以使用 `util` 模块中的 
`promisify()` 函数来将其包装成 Promise（NodeJS 版本高于 `8.0`），或者直接使用它们，
然后在你想要返回数据给前端的地方，直接调用 `res.send()` 方法即可。请看下面的示例：

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

有些时候你可能想要在真正的方法被调用前做一些事情，你可能想要进行一些额外的配置，在类被
实例化前，你想要自定义类的 `constructor`。就像下面这样：

```typescript
import { HttpController, Request, Response } from "sfn";

export default class extends HttpController {
    constructor(req: Request, res: Response) {
        super(req, res);
        
        // your stuffs...
    }
}
```

### 关于 Request 和 Response 的提示

`Request` 和 `Response` 是 TypeScript 接口，实际上在 **SFN** 框架中存在着很多的
接口（和别名类型）。它们并不是类，因此也不能被实例化，或者使用 `instanceof` 来
检测，如果你在代码中有任何这样的代码，那只会给你自己造成麻烦。

```typescript
// This example is wrong and should be avoid.

var obj = new Request;

if (obj instanceof Request) {
    // ...
}
```
接口（和类型）在 JavaScript 中是不导出的，因此下面的代码是不正确的。

```javascript
const { Request } = require("sfn"); // Request would be undefined.
```

## 在控制器中抛出 HttpError

`HttpError` 是一个由框架定义的错误类，它是安全的，你可以在想要响应一个 HTTP 错误到
客户端时使用它。当一个 HttpError 被抛出时，框架将会对其进行合适的处理，并自动地发送
错误响应内容。

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

框架会检查客户端所接受地响应类型，并用合适的方式发送错误信息。通常地，一个普通的 HTTP
错误页面会被返回。但如果在请求头中出现了 `Accept: application/json`，一个状态码为 
`200` 并携带 JSON 信息 `{success: false, code, error}` 的响应将会被返回，这个响应
形式来自于控制器方法 [error()](./http-controller#Common-API-response).。

如果这个响应头没有出现，那么框架会检查是否在 `src/views/` 目录中存在着一个名称和错误
代码对应的模板（如 `404.html`）。如果文件存在，那它将会被发送为错误页面，否则，一个
简单的错误响应将会被返回。

### 自定义错误页面

默认地，框架会根据错误代码发送一个对应的视图文件，并且仅传递 `err: HttpError` 对象
到模板中，它可能并不满足一些复杂的需求。因此，框架允许你自定义错误处理器，通过重写静态
方法 `HttpController.httpErrorView` 来实现。下面的示例将向你展示如何做。

```typescript
// src/bootstrap/http.ts
import { HttpController, date } from "sfn";

HttpController.httpErrorView = function (err, instance) {
    let vars = {
        err,
        title: err.toString(),
        copyRight: "&copy; " + date("Y") + " My Website.",
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

一个控制器实际上就是一个服务，你可以在一个控制器中使用任何在 [Service](./service) 
中有效的特性。