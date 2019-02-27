<!-- title: 安全; order: 9 -->
## 授权

`HttpController` 和 `WebSocketController` 都提供了一个简单地方式来控制用户的权限。

当一个 HTTP 请求或者 socket.io 事件触发时，框架会尝试恢复登录用户的会话信息。框架
检测是否有用户登录的方法是，检查 `session` 对象的键值对中是否存在一个合法的 `uid` 
属性，如果 `uid` 存在，就尝试获取该用户的实例，并将其赋值到 `req.user` 或者 
`socket.user` 属性上。

如果有任何用户被取回，那么该用户就被视为以登录的。你可以
[定义自己的 `User` 类](./orm-model#User-模型)，并将其存储到 `src/models/` 目录下，
从而扩展默认的 `modelar.User` 类，否则这个默认类将会被使用。

因此如果你想要设置一个用户的状态为已登录，你只需要设置 `req.session.uid` 或者 
`socket.session.uid` 为一个用户 ID 即可。记住，会话在 **SFN** 框架中是共享于 HTTP 
和 WebSocket 之间的，这意味着一旦你修改了其中一端，另一端也会同时被改变。

在控制器中，存在着一个属性 `authorized`，如果它的值是 `true`，那就意味着操作是被
允许的，`false` 则相反。默认的，框架只检查 `req.user !== null`
（或 `socket.user !== null`），你可以设置更复杂的检测条件以便其适合你的需要。

如果操作是未授权的，框架将会自动抛出一个 HttpError（或 SocketError）
`401 Unauthorized` 并返回到客户端。

### 如何要求授权？

很简单，你只需要使用装饰器 `@requireAuth` 来修饰方法即可，当这个方法被通过 URL 
（或 WebSocket 事件）调用时，检测过程就会被自动的执行。

### 示例

```typescript
import { HttpController, Request, Response, route, requireAuth } from "sfn";

export default class extends HttpController {
    constructor(req: Request, res: Response) {
        super(req, res);

        // instead of checking req.user, here I will check req.auth, HTTP 
        // basic authentication.
        this.authorized = req.auth !== null
            && req.auth.username === "luna"
            && req.auth.password === "12345";

        // Since this is a HttpController, you can set 'fallbackTo' property a
        // URL, so that when unauthorized, instead of throwing 401 error, 
        // redirect to the given URL.
        this.fallbackTo = "/auth";
    }

    @requireAuth
    @route("/auth-example")
    index() {
        return "This message will be sent if the operation is permitted.";
    }

    @route("/auth")
    auth(req: Request, res: Responce) {
        if (!req.auth) {
            // res.auth() will lead you to HTTP basic authentication.
            return res.auth();
        } else {
            return "User has been authorized.";
        }
    }
}
```

上面的示例展示了直接在构造器函数中检查授权状态，因为它们全部都是同步逻辑，但大多数情况下
你可能会需要做一些异步的操作，如从数据获取数据等，你需要查看一下文档
[前置和后置操作](./http-controller#前置和后置操作) 以及
[面向切面编程](./aop-mixins#面向切面编程).

## CSRF 防护

CSRF 安全问题其实是一个非常老的话题，根据我的经验，现代浏览器已经为你提供了足够多的
保护。但某些情况下，你可能需要做一些自己保护。

在 **SFN** 框架中使用 CSRF 保护是很简单的，你只要在 HttpController 中打开它即可。

```typescript
import { HttpController, route } from "sfn";

export default class extends HttpController {
    csrfProtection = true; // turn on CSRF protection

    @route.get("/")
    index() {
        // you can get the token and pass it to the view.
        let token: string = this.csrfToken;
        return this.view("index", { token });
    }

    @route.post("/csrf-test")
    csrfTest() {
        // When this method is about to be called, the framework will 
        // automatically check whether the csrf token is matched. if not, a 
        // 403 Forbidden error will be thrown, and this method will never be 
        // called.
        return "CSRF checking passed.";
    }
}
```

### 自动插入 CSRF Token

你可以使用函数 `injectCsrfToken()` 来帮助你将 CSRF Token 插入到 HTML 表单中，但是
你需要保证你的试图文件地书写是格式化的，并且仅支持 HTML 文件（或 **ejs** 模板）。

```typescript
import { HttpController, route, injectCsrfToken } from "sfn";

export default class extends HttpController {
    csrfProtection = true;

    @route.get("/")
    async index() {
        // you can get the token and passed to the view.
        let token: string = this.csrfToken;
        let html = await this.view("index");
        return injectCsrfToken(html, token);
    }
}
```

### 将 CSRF Token 返回给服务器

在客户端，，你只需要将字段 `x-csrf-token`，其携带着 token，一同与你的数据发送给
服务端即可，你可以通过下面任何一种方式来发送这个字段：

- `HTTP request header` for Ajax.
- `URL search string` e.g. `?x-csrf-token={token}`
- `request body` a.k.a. HTML forms.

当你使用任何一个以下的请求方法时，你必须发送 token，否则一个 `403 Forbidden` 错误将会
被抛出。

- `DELETE`
- `PATCH`
- `POST`
- `PUT`

## CORS 控制

允许来自不受信任的访问源进行请求会产生一些问题，虽然现代浏览器更倾向于屏蔽来自跨域的
响应，但是在服务端，其操作已经被正常地执行，即使远程客户端永远不会意识到。

**SFN** 框架赋予你完全控制 CORS 地能力，并且它很容易配置。如平时一样，你需要在控制器
中开启它。

### CORS 示例

```typescript
import { HttpController, route } from "sfn";

export default class extends HttpController {
    cors = "example.com";

    // ...
}
```

在这个示例中，只有受信任的源 `example.com` 可以访问绑定到控制器的 URL 地址。

`cors` 可以被设置为下面这些值：

- **a single hostname** or an array that carries **several hostnames** to 
    accept particular origins.
- **an asterisk (`*`)** to accept all origins.
- **an object** that carries these information:
    - `origins: string | string[]` the same as the above two rules.
    - `methods?: string | string[]` accepts particular HTTP request methods.
    - `headers?: string | string[]` accepts particular HTTP request headers.
    - `credentials?: boolean` allow credentials.
    - `maxAge?: number` how long the results of a preflight request can be 
        cached.
    - `exposeHeaders?: string | string[]` lets a server whitelist headers 
        that browsers are allowed to access.

更多细节请查看 
[HTTP 访问控制 (CORS)](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)。

框架使用 [sfn-cors](https://github.com/Hyurl/sfn-cors) 模块来处理 CORS 控制，它
增强了传统的 CORS 访问控制检测，允许你同时检查多个来源并支持多种形式。可能的主机地址
形式为：

- `https://github.com` allow only https scheme for this host.
- `http://github.com` allow only http scheme for this host.
- `github.com` allow any scheme for this host.
- `*.github.com` allow any sub-domain including second-level domain itself.
- `https://*.github.com` same as above but restrict for https only.
- `github.com:*` allow any port for this host.
- `*.github.com:*` allow any port for this host and any sub-domain.
- `https://*.github.com:*` same as above but restrict for https only.

某些浏览器，如 Chrome，并不会检查 `Access-Control-Allow-Methods` 和 
`Access-Control-Allow-Headers`，或者弱性检查，但使用这个模块，请求方法和请求头总是
严格检查的。

当访问控制检测不通过时，或者请求的方法是 `OPTIONS`（无论成功还是失败），连接将会被
立马中断，也不会再有任何后续操作被执行。

## XSS 防御

XSS 攻击远比 CRSF 和 CORS 要危险得多。在任何时候，这条黄金法则都是有效的：
**永远不要信任用户输入**。如果没有进行任何过滤，黑客可能会注入危险的代码到你的网站中，
然后在其他用户访问危险页面时危害到网站和用户的安全。

为了防止你的网站被来自 XSS 的攻击所入侵，**SFN** 提供了一些非常实用的函数，允许你过滤
用户输入内容中不安全的代码。

框架使用 [sfn-xss](https://github.com/Hyurl/sfn-xss) 模块来提供过滤支持。

### 过滤 HTML 标签

函数 `escapeTags()` 被用来过滤可能执行不安全代码的 HTML 标签。默认地，这些标签将会被
过滤掉：

- `<script>`
- `<style>`
- `<iframe>`
- `<object>`
- `<embed>`

你可以指定第二个参数 `tags` 来自定义哪些标签是需要被过滤掉的。

```typescript
import { escapeTags } from "sfn";

var html = "<script>document.write('You are being hacked.')</script>";
var escaped = escapeTags(html);

console.log(escaped);
// => &lt;script&gt;document.write('You are being hacked.')&lt;/script&gt;
```

指定的标签将会被替换为安全的实体，从而防止代码被运行，并且保证内容能够被合适地显示出来。

### 过滤脚本链接

函数 `escapeScriptHrefs()` 被用来过滤包含脚本的 `href` 属性。

```typescript
import { escapeScriptHrefs } from "sfn";

var html2 = `<a href="javascript:document.write('You are being hacked.');">`;
var escaped2 = escapeScriptHrefs(html2);

console.log(escaped2);
// <a data-href="jscript:document.write('You are being hacked.');">
```

`href` 属性将会被替换成 `data-href`，从而其代码将永远不会运行。

### 过滤事件属性

函数 `escapeEventAttributes()` 被用来过滤事件属性，例如 `onclick`、`onmouseover`，
它们也将会被使用 `data-` 前缀修饰。

```typescript
import { escapeEventAttributes } from "sfn";

var html3 = `<button onclick="document.write('You are being hacked.')">`;
var escaped3 = escapeEventAttributes(html3);

console.log(escaped3);
// <button data-onclick="document.write('You are being hacked.')">
```

## 验证表单

XSS 过滤函数在某些时候可能会不尽人意，因此你还有另外的选择，使用表单验证器来检查用户
的输入。

框架建议使用 [sfn-validator](https://github.com/Hyurl/sfn-validator) 模块来检查
用户输入，你可以在 GitHub 上学习更多关于它的信息。

### 示例

```typescript
import { HttpController, Request, route } from "sfn";
import { User, NotFoundError } from "modelar";
import { Validator } from "sfn-validator";

let validator = new Validator({
    email: {
        type: "email",
        length: [5, 25]
    },
    password: {
        type: "string",
        length: [3, 18]
    }
});

export default class extends HttpController {

    @route.post("/login")
    async login(req: Request) {
        try {
            validator.validate(req.body);

            let email = req.body.email,
                password = req.body.password,
                user = await User.use(this.db).login({ email, password });

            req.session.uid = user.id;

            return this.success(user);
        } catch (err) {
            return this.error(err, err instanceof NotFoundError ? 404 : 400);
        }
    }
}
```