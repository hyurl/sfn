<!-- title: 视图; order: 8 -->
## 基本概念

自 0.5.x 版本起，SFN 启用了新的视图系统来将模板作为动态模块以便实现自动加载和热重载。

## 使用示例

在一个 HttpController 中，你可以使用 `view()` 方法来展示模板。（默认地，框架不
使用模板引擎，仅将搜寻到的 HTML 文件直接导入。）

```typescript
import { HttpController, route } from "sfn";

export default class extends HttpController {

    @route.get("/")
    index() {
        return this.view("index"); // the extension name will be .html.
    }
}
```

## 模板引擎加载器

现代化 Web 开发中模板引擎已经不再重要，因此自 0.5.x 版本起，SFN 仅提供了两个
基于 Alar 引擎的模板引擎加载器。

- [alar-ejs-loader](https://github.com/hyurl/alar-ejs-loader)
- [alar-pug-loader](https://github.com/hyurl/alar-pug-loader)

这些加载器所返回的模块包含了一个 `render(data: { [name: string]: any }): string`
方法，当调用 `view()` 方法时，SFN 会自动调用 `render()` 方法来渲染模板。

你必须自己去学习这些模板引擎，这份文档将不会介绍任何关于它们的细节。

### 使用 Ejs 引擎的示例

注意：自 1.0 版本起，SFN 从 Alar 切换到了 Microse，虽然旧的加载器依旧能够在新系统中工作，
因为两个引擎的加载器是兼容的，但它们需要通过 CommonJS 的 `require()` 函数进行导入，从而避免
在编译程序时报错，因为新系统将不会携带任何 Alar 的头文件。

```typescript
// src/bootstrap/http.ts
import { EjsLoader } from "alar-ejs-loader"; // use require instead of import

app.views.setLoader(new EjsLoader());
```

更多细节请查看各加载器对应的说明。

## 适配你自己的引擎

如果你自己编写了一套模板引擎，或者想要使用其他的模板引擎，你可以自己实现一个加载器，这非常简单，
例如一个 Ejs 加载器可以这么实现：

```typescript
import * as fs from "fs";
import * as ejs from "ejs";
import { ModuleLoader } from "microse";

export namespace EjsLoader {
    export interface View {
        render(data: { [name: string]: any }): string;
    }

    export interface Options {
        /**
         * Specifies encoding for loading the template (default: `utf8`).
         */
        encoding?: string;
        /** When `false` no debug instrumentation is compiled. */
        compileDebug?: boolean;
        /** Character to use with angle brackets for open/close. */
        delimiter?: string;
        /** Outputs generated function body. */
        debug?: boolean;
        /** When `true`, generated function is in strict mode. */
        strict?: boolean;
        /** 
         * Removes all safe-to-remove whitespace, including leading and trailing 
         * whitespace.
         */
        rmWhitespace?: boolean;
    }
}

export class EjsLoader implements ModuleLoader {
    extension = ".ejs";
    cache: { [filename: string]: EjsLoader.View } = {};

    constructor(private options: EjsLoader.Options = {}) { }

    load(filename: string) {
        if (this.cache[filename]) {
            return this.cache[filename];
        }

        let tpl = fs.readFileSync(filename, this.options.encoding || "utf8");

        return this.cache[filename] = {
            render: ejs.compile(tpl, {
                ...this.options,
                filename,
                cache: false,
                async: false
            })
        };
    }

    unload(filename: string) {
        delete this.cache[filename];
    }
}
```

更多关于模块加载器的细节，请查看
[Microse ModuleLoader](https://github.com/microse-rpc/microse-node/blob/master/docs/api.md#moduleloader).。
