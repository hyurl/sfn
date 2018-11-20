<!-- title: ORM Model; order: 5 -->
# Concept

**SFN** uses [Modelar](https://github.com/hyurl/modelar) as its ORM system, 
it's a very easy-to-use but functional ORM module with full featured SQL and
Query builder supports. Here I will just give you some simple examples to 
demonstrate the styles of using **Modelar**, you need to learn it for other 
features.

## Example

## Initiate Database Connection

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

### Model Class

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

### Query Builder

```typescript
import { Query } from "modelar";

var query = new Query("articles");

(async () => {
    let article = await query.where("id", 1).get();
    console.log(article);
})();
```

### Create Table

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

If you have an `Article` class as the above one, you can use it to create the 
table:

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

## In SFN

In an **SFN** application, you should put your model files in `src/models/`, 
and import them wherever you want.

About the database connection configuration, although here I've shown you how 
to initiate the **DB** constructor, but it's not what we are going to do in 
the framework.

In **SFN** framework, you should always modify the configuration file 
`config.ts` to set configurations.

```typescript
export const conifg: SFNConfig = {
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

And in a service, call the property `db` to get a instance, like this: 

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

The `db` property is also bound to the `req` and `socket` object, you can 
reference it from these two objects as well.

## The User Model

By default, the framework uses the default `User` class of **Modelar**, for 
authorization and other stuffs, but its obvious not suitable for your project,
so you should define a new class to replace it.

```typescript
// src/models/User.ts
import * as modelar from "modelar";

export class User extends modelar.User {
    // ...
}
```