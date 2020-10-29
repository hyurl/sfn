<!-- title: AOP 和 Mixins; order: 18 -->
# 基本概念

**AOP**(面向切面编程)和 **Mixins**（混合）的意义是编写高复用性的代码，以适合不用的应用
场景，并且你不需要扩展你的类。

## 面向切面编程

**AOP** 是一个 SFN 应用中飞中重要的部分，并且它非常易于实现。要使用这个特性，你只需要
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