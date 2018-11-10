<!-- title: 日志; order: 11 -->
# 基本概念

你可能已经在 [Service](./service) 页面中看到了 `logger` 属性，它实际上是由 
[sfn-logger](https://github.com/hyurl/sfn-logger) 模块提供支持的。你也许会想要
了解更多关于这个模块的复杂细节，但是在 **SFN** 框架中，这不是必须的，在大多数时候，你
只需要从 `logger` 属性中调用它。

默认地，日志文件将会保存在 `src/logs/` 目录中。

## 如何使用？

`logger` 对象非常类似于内置的 `console` 对象，其用法也相同，你不需要学习任何新的知识
便能够使用它，只需要改变一下习惯，使用 `logger` 来替代 `console`，当你需要将日志记录
到一个文件中时。 

### 示例

```typescript
import { Service } from "sfn";
import { User } from "modelar";

var srv = new Service;

(async (id: number) => {
    try {
        let user = <User>await User.use(srv.db).get(id);
        srv.logger.log(`Getting user (id: ${id}, name: ${user.name}) succeed.`);
        // ...
    } catch (e) {
        srv.logger.error(`Getting user (id: ${id}) failed: ${e.message}.`);
    }
})(1);
```

## `console` 和 `logger` 的区别

这两个对象之间有两个主要的区别：

- `logger` 将日志保存到一个磁盘文件中。
- `logger` 是异步非阻塞的。

## 配置

你可以在服务类的定义中进行设置，`logOptions` 属性就是你的目标，下面的示例将展示给你
如何配置日志对象从而将其重写为当其文件体积达到 2Mb 时，将其内容转发到一个电子邮件地址
上。

### 日志配置的示例

```typescript
// src/controllers/Example.ts
import { HttpController, Request, Response, config, route } from "sfn";

export default class extends HttpController {
    constructor(req: Request, res: Response) {
        super(req, res);
        this.logOptions.ttl = 0;
        this.logOptions.size = 1024 * 1024 * 2; // 2Mb
        this.logOptions.mail = Object.assign({}, config.mail, {
            subject: "[Logs] from my website",
            to: "reciever@example.com"
        });
    }

    @route.get("/example")
    index() {
        this.logger.log("An example log.");
        return true;
    }
}
```

## 自动栈追踪

在记录日志时，**sfn-logger** 会自动追踪调用栈（可配置，默认开启），从而输出包含调用函数、
文件名、行号和列号的记录，在上述的例子中，当方法 `index()` 被调用时，它将会记录类似这样
的信息：

```plain
[2018-02-20 17:48:16] [default.index (d:/my-website/src/controllers/Example.ts:16:24)] - An example log.
```

## 在 **SFN** 框架中的特殊表现

在 **SFN** 框架中，服务中的 `logger` 属性会有一些特殊的表现，不同于来自 
**sfn-logger** 模块的原始的 `new Logger()`。

首先，`logger` 的实例会被缓存到内存中且根据文件名作为区分，这意味着即使在不同的服务
中，只要你设置了 `logOptions.filename` 为相同的名字，那它们将没有任何作用，只有第一个
被引用的配置会被使用。