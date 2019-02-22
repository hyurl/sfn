<!-- title: ORM 模型; order: 5 -->
# 基本概念

**SFN** 使用 [Modelar](https://github.com/hyurl/modelar) 来作为它的 ORM 系统， 
这是一个简单易用但是却功能丰富的 ORM 模块，携带着全功能的 SQL 和查询语句构造器支持。
在这里我只会向你展示一些简单例子，来加深你对 **Modelar** 使用风格的印象，你需要自己
去学习它的其他特性。

## 示例

## 初始化数据库连接

```typescript
import { DB } from "modelar";

DB.init({
    type: "mysql",
    host: "localhost",
    port: 3306,
    database: "modelar",
    user: "root",
    password: "161301"
});
```

### Model 类

```typescript
import { Model, field, primary, searchable } from "modelar";

export class Article extends Model {
    table = "articles";

    @field
    @primary
    id: number;

    @field("varchar", 255)
    title: string

    @field("text")
    content: string;
}

(async () => {
    let article = new Article;
    
    article.title = "Example article";
    article.content = "Example article";

    await article.save();
})();

(async () => {
    let article = <Article>await Article.get(1),
        article2 = <Article>await Article.where("title", "Example article").get();

    console.log(article);
    console.log(article2);
})();
```

### 查询语句构造器

```typescript
import { Query } from "modelar";

var query = new Query("articles");

(async () => {
    let article = await query.where("id", 1).get();
    console.log(article);
})();
```

### 创建数据表

```typescript
import { Table } from "modelar";

var table = new Table("articles");

table.addColumn("id").primary().autoIncrement();
table.addColumn("title", "varchar", 255).notNull();
table.addColumn("content", "text").default("");

(async () => {
    await table.save();
})();
```

如果你有一个如上的 `Article` 类，你也可以使用它来创建数据表：

```typescript
import { Table } from "modelar";
import { Article } from "./Article";

var table = new Table(new Article);

(async () => {
    await table.save();
})();

// Or just call the method createTable in Article class.
(async () => {
    let table = await Article.createTable();
})();
```

## 在 SFN 中

自 SFN 0.5.x 版本起，请始终使用 Alar 的模块解决方案来定义模型，以便利用其自动加载和
热重载特性。

```typescript
// src/models/article.ts
import { Model, field, primary, searchable } from "modelar";

declare global {
    namespace app {
        namespace models {
            const user: ModuleProxy<User>;
        }
    }
}

export default class Article extends Model {
    table = "articles";

    @field
    @primary
    id: number;

    @field("varchar", 255)
    title: string

    @field("text")
    content: string;
}
```

关于数据库连接配置，虽然这儿我已经为你展示了如何初始化 **DB** 构造器对象，但这并不是
我们将要在框架中使用的方式。

在 **SFN** 框架中，你应该始终修改配置文件 `config.ts` 来设置配置选项。

```typescript
export var config: SFNConfig = {
    // ...
    database: {
        type: "mysql",
        host: "localhost",
        port: 3306,
        database: "modelar",
        user: "root",
        password: "161301"
    },
    // ...
}
```

然后再服务中，调用 `db` 属性来取得一个实例，就像这样：

```typescript
import { HttpController, route } from "sfn";

export default class extends HttpController {
    @route("GET", "/")
    index() {
        let db = this.db;
        // ...
    }
}
```

这个 `db` 属性也绑定到了 `req` 和 `socket` 对象上，你也可以通过这两个对象来引用它。 

## User 模型

默认地，框架会使用 **Modelar** 自带地默认 `User` 类，用于授权以及一些其它地事务，但
它显然不适合你地项目，因此你应该定义一个新的类来替换它。

```typescript
// src/models/user.ts
import * as modelar from "modelar";

declare global {
    namespace app {
        namespace models {
            const user: ModuleProxy<User>;
        }
    }
}

export default class User extends modelar.User {
    // ...
}
```