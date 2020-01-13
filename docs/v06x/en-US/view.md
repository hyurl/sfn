<!-- title: View; order: 6 -->
# Concept

Since version 0.5.x, SFN introduces a new view system, and use 
[Alar](https://github.com/hyurl/alar) framework to resolve templates as dynamic 
modules in order to auto-load and hot-reload them.

# How To Use?

In an HttpController, you can use `view()` method to display a template. (By 
default, the framework will not use any template engine, just import the HTML 
file directly.)

## Example

```typescript
import { HttpController, route } from "sfn";

export default class extends HttpController {

    @route.get("/")
    index() {
        return this.view("index"); // the extension name will be .html.
    }
}
```

## Template Engines Loader

In modern web development, template engines are less important, so since 
0.5.x, SFN only provides two template engines based on Alar framework.

- [alar-ejs-loader](https://github.com/Hyurl/alar-ejs-loader)
- [alar-pug-loader](https://github.com/Hyurl/alar-ejs-loader)

These loaders all return a module that includes a method 
`render(data: { [name: string]: any }): string`, when calling `view()` method, 
SFN will automatically calling `render()` to render the template.

You must learn these engines yourself, this documentation won't introduce them
in detail.

### Example of Using Ejs

```typescript
// src/bootstrap/http.ts
import { EjsLoader } from "alar-ejs-loader";

app.views.setLoader(new EjsLoader());
```

### Adapt Your Own Engines

If you have your own template engine, or you wish to use another template engine,
you can implement a new loader yourself, it's very easy. e.g. alar-ejs-loader
just did this:

```typescript
import * as fs from "fs";
import * as ejs from "ejs";
import { ModuleLoader } from "alar";

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

More details about Alar module loader, please check
[Alar ModuleLoader](https://github.com/hyurl/alar/blob/master/api.md#moduleloader).