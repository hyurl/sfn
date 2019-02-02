<!-- title: Mixins 和 AOP; order: 18 -->
# 基本概念

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
安装另一个名为 [function-intercepter](https://github.com/hyurl/function-intercepter)
的模块，你应该查看它的文档以便了解更多特性。

```typescript
import { HttpController, before, after } from "sfn";
import { interceptAsync } from "function-intercepter";

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
import { interceptAsync } from "function-intercepter";

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

除了直接调用 `before` 和 `after` 外，你可以定义任何你想要的函数并作为装饰器来使用。
为了方便，你也可以定义一个拦截器函数并在内部调用 `before` 和 `after`，请查看模块
[sfn-validate-decorator](https://github.com/hyurl/sfn-validate-decorator) 作为
示例。

## 插件

插件是另一种在软件中实现 AOP 编程的方式。通过使用插件，人们可以很容易地编写可插拔、可扩展的组件
来处理对象，而不需要修改任何源代码。

在 SFN 中，要使用插件，你需要安装另一个包名为 [async-plugin](https://github.com/hyurl/)
的模块。为了方便，你应该在 `src/` 目录下新建一个名为 `plugins/` 的文件夹来存储所有的插件。

```typescript
// src/plugins/user.ts
import { User } from "modelar";
import AsyncPlugin from "async-plugin";
import Axios from "axios";

export namespace UserPlugins {
    export const onAdd = new AsyncPlugin({}, User);
    export const onGet = new AsyncPlugin({}, User);
    export const onUpdate = new AsyncPlugin({}, User);
    export const onDelete = new AsyncPlugin({}, User);
    // ...
}

// You can bind any number of handler functions to the corresponding plugin in 
// order to achieve some goals. e.g.

// assign user name
UserPlugins.onAdd.bind((input, user) => {
    user.name = input.name || "Joe";
});

// check if email is available
UserPlugin.onAdd.bind(async (input, user) => {
    if (input.email) {
        // check email via a remote service
        let res = await Axios.get(`https://somewhere.com/email-test?email=${input.email}`);
        let ok = res.data.ok;

        if (!ok) {
            throw new Error("user email is invalid or unsupported.");
        }

        user.email = input.email;
    }
});

// ...
```

你可以将插件应用在一个 HTTP 控制器中（或者任何你想要的位置）。

```typescript
// src/controllers/api/user.ts
import { HttpController, Request, route } from "sfn";
import { User } from "modelar";
import { UserPlugins } from "../../../plugins/user.ts";

export default class extends HttpController {
    static baseURI = "/api";

    @route.post("/user")
    async add(req: Request) {
        // apply the plugin and handle data in the plugin instead of doing it 
        // in the controller.
        let user = await UserPlugins.onAdd.apply(req.body || {}, new User);
        return user.save();
    }
}
```

插件是可插拔的组件，如果你想要在应用的某个过程中添加新功能，只需要绑定一个新的处理器函数到插件
接口上，如果你想要移除某个功能，只需要从插件接口中移除对应的处理器函数即可。通过这种方式，你可以
编写具有极高扩展性的应用软件，只需要建立一个插件系统，并将其覆盖到你的软件生命周期中的各个入口
即可。