<!-- title: Mixins 和 AOP; order: 18 -->
## 基本概念

**Mixins**（混入）和 **AOP** (面向切面编程)的意义是编写高复用性的代码，以适合不用的应用
场景，并且你不需要扩展类程序。

## 横向继承 (Mixins)

**Mixins** 允许你继承来自多个类的属性和方法，而不仅仅是父类的属性和方法。要使用 mixins，
你需要安装另一个模块 [class-mixins](https://github.com/hyurl/class-mixins)，你应该
查看它的文档以便了解更多特性。

```typescript
// <SRC_PATH>/mixins/CheckUserState.ts
import { HttpController } from "sfn";

export class CheckUserState extends HttpController {
    private loggedIn: boolean;

    async ensureLogin() {
        if (this.loggedIn) {
            // ...
        }
    }
}
```

```typescript
// <SRC_PATH>/controllers/User.ts
import { HttpController } from "sfn";
import { Mixed } from "class-mixins";
import { CheckUserState } from "../mixins/CheckUserState";

export default class extends Mixed(HttpController, CheckUserState) {
    async display() {
        await this.ensureLogin();
        // ...
        // be aware that this instance is an instance of HttpController, but 
        // not of CheckUserState, so
        console.log(this instanceof HttpController); // true
        console.log(this instanceof CheckUserState); // false
    }
}
```

## 面向切面编程

**AOP** 是一个 SFN 应用中非常重要的部分，并且它非常易于实现。要使用这个特性，你只需要
安装另一个名为 [function-intercept](https://github.com/hyurl/function-intercept)
的模块，你应该查看它的文档以便了解更多特性。

```typescript
import { HttpController, before, after } from "sfn";
import { interceptAsync } from "function-intercept";

export default class MyController extends HttpController {
    private loggedIn: boolean;

    @interceptAsync<MyController>().before(async function () {
        // the `this` in this function reference to the controller instance
        // ...
        if (!this.loggedIn) {
            this.res.redirect("/login");
            // returning `false` to prevent invoking the main method.
            return false;
        }
    }).after(async function () {
        // this function will be called after the method has been called
    })
    async display() {
        // ...
    }
}
```

上面的例子只是展示了该如何通过装饰器直接设置过滤器函数到方法上，但大多数时候，你会想要
将其定义为可以在多种场景中重复使用的函数。

```typescript
import { HttpController } from "sfn";
import { interceptAsync } from "function-intercept";

export function checkLogin(this: HttpController) {
    // ...
    if (!this["loggedIn"]) {
        this.res.redirect("/login");
    }
}

export default class extends HttpController {
    @interceptAsync().before(checkLogin)
    display() {
        // ...
    }
}

export class AnotherController extends HttpController {
    @interceptAsync().before(checkLogin)
    show() {
        // ...
    }
}
```

除了直接调用 `before` 和 `after` 外，你可以定义任何你想要的函数并作为装饰器来使用，只需要把它
包裹在 `interceptAsync().before()` 中。实际上，`@requireAuth` 就是通过这种技巧实现的。

```ts
import { interceptAsync, intercept } from 'function-intercept';

/** Requires authentication when calling the method. */
export const requireAuth: ControllerDecorator = interceptAsync().before(
    function (this: Controller) {
        if (!this.authorized) {
            if (this instanceof HttpController) {
                if (typeof this.fallbackTo === "string") {
                    this.res.redirect(this.fallbackTo, 302);
                } else if (this.fallbackTo) {
                    this.res.send(this.fallbackTo);
                } else {
                    throw new StatusException(401);
                }

                return intercept.BREAK;
            } else {
                throw new StatusException(401);
            }
        }
    }
);
```

## 钩子

钩子是另一种在软件中实现 AOP 编程的方式。通过使用钩子，人们可以很容易地编写可插拔、可扩展的组件
来处理对象，而不需要修改任何源代码。

自 0.5.x 版本起，SFN 引入了新的内置钩子支持，并实现了热重载和动态加载支持。钩子无须创建实例，
并且会在软件启动时将现有钩子全部加载到系统中。所有的钩子都应存放在 `src/hooks/` 文件夹中。

> 在历史版本中，钩子曾经被叫做插件 (Plugin)，但从 v0.6 版本起，为了使含义更加清晰，
> 它已经被重命名为钩子 (Hook)。如果你此前有使用~~插件~~，要迁移其实也很简单，只需要
> 选中命名空间 `app.plugins`，按下 `F2` 并将其重命名为 `app.hooks` ，然后修改
> 将文件夹名称从 `src/plugins/` 修改为 `src/hooks/` 即可。

```typescript
// src/hooks/user.ts
import { Hook } from 'sfn';
import Axios from "axios";
import User from "../models/user";

declare global {
    namespace app {
        namespace hooks {
            namespace user {
                const onAdd: Hook<object, User>;
            }
        }
    }
}

// You can bind any number of handler functions to the corresponding hook in 
// order to achieve some goals. e.g.

// assign user name
app.hooks.user.onAdd.bind((input, user) => {
    user.name = input.name || "Joe";
});

// check if email is available
app.hooks.user.onAdd.bind(async (input, user) => {
    if (input.email) {
        // check email via a remote service
        let url = `https://somewhere.com/email-test?email=${input.email}`;
        let res = await Axios.get(url);
        let ok = res.data.ok;

        if (!ok) {
            throw new Error("user email is invalid or unsupported.");
        }

        user.email = input.email;
    }
});
```

你可以将钩子应用在一个 HTTP 控制器中（或者任何你想要的位置）。

```typescript
// src/controllers/api/user.ts
import { HttpController, Request, route } from "sfn";

export default class extends HttpController {
    static baseURI = "/api";

    @route.post("/user")
    async add(req: Request) {
        // apply the hook and handle data in the hook instead of doing it 
        // in the controller.
        let data = req.body || {};
        let user = new app.models.user();

        user = await app.hooks.user.onAdd.invoke(data, user);

        return user.save();
    }
}
```

### 内置的钩子接口

SFN 框架内置使用了一个名为 `lifeCycle` 的钩子接口，用以控制服务启动和关闭有关的活动，
你也可以将自己的一些逻辑绑定到该接口上，来在系统启动或关闭时打开或关闭一些资源。下面的
示例来自 SFN 网站自己的逻辑：

```typescript
// src/logger-server.ts
// Try to safely close the logger service.
app.hooks.lifeCycle.shutdown.bind(async () => {
    await app.services.logger().close();
});
```

钩子是可热插拔的组件，如果你想要在应用的某个过程中添加新功能，只需要绑定一个新的处理器函数到钩子
接口上，如果你想要移除某个功能，只需要从钩子接口中移除对应的处理器函数即可，并且利用系统的热重载
特性将修改立即应用。通过这种方式，你可以编写具有极高扩展性的应用软件，只需要建立一个钩子系统，并
将其覆盖到你的软件生命周期中的各个入口即可。
