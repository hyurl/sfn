<!-- title: View; order: 6 -->
# Concept

In an **SFN** application, view system is bound to `HttpController`.

# How To Use?

In an HttpController, you can use the method `view()` to display a template. 
By default, the framework uses [Ejs](https://www.npmjs.com/package/ejs) as its
template engine, we will talk about other engines later in this documentation.

## Example

```typescript
import { HttpController, route } from "sfn";

export default class extends HttpController {

    @route.get("/")
    index() {
        return this.view("index"); // the extension name will be .html.
    }

    @route.get("/with-extname")
    withExtname() {
        return this.view("index.ejs");
    }

    @route.get("/with-locals")
    withLocals() {
        // You can use these local variables in the template.
        let locals = {
            title: "My first sfn application.",
            author: "Luna"
        };

        return this.view("index", locals);
    }
}
```

## Template Path

By default, template files are stored in `src/views/`, you can change to 
whatever path by setting the property `viewPath` to a different value.

```typescript
import { HttpController, route, SRC_PATH } from "sfn";

export default class extends HttpController {
    viewPath: SRC_PATH + "/views/my-views/"; // => src/views/my-views/

    // ...
}
```

## Template Engines

By default, the framework uses [Ejs](https://www.npmjs.com/package/ejs) as its
template engine, but you can choose other engines if you want. There are 
several optional engines available:

- [sfn-ejs-engine](https://github.com/Hyurl/sfn-ejs-engine)
- [sfn-pug-engine](https://github.com/Hyurl/sfn-pug-engine)
- [sfn-nunjucks-engine](https://github.com/Hyurl/sfn-nunjuncks-engine)
- [sfn-sdopx-engine](https://github.com/Hyurl/sfn-sdopx-engine)
- [sfn-whatstpl-engine](https://github.com/Hyurl/sfn-whatstpl-engine)

You must learn these engines yourself, this documentation won't introduce them
in detail.

### Example of Using Pug

```typescript
// you need install sfn-pug-engine first.
import { HttpController, route } from "sfn";
import { PugEngine } from "sfn-pug-engine";

var engine = new PugEngine();

export default class extends HttpController {
    engine: PugEngine = engine;
    viewExtname = ".pug"; // set the default extension name of view files.

    @route.get("/pug-test")
    index() {
        return this.view("pug-test");
    }
}
```

### Adapt Your Own Engines

If you have written a template engine, or want to use one that already exists 
but hasn't been adapt to **SFN**, you can make the adapter yourself, it 
wouldn't be hard.

All you have to do, is define a new class that extends the abstract class 
`TemplateEngine`, and implement the `renderFile()` method, see this example:

```typescript
import { TemplateEngine, TemplateOptions } from "sfn";

export interface MyEngineOptions extends TemplateOptions {
    // TemplateOptions has two properties:
    // `cache: boolean` indicates wheter turn on cache, so your template should
    //     support caches.
    // `encoding: string` uses a specified encoding to load the file.
    // ...
}

export class MyEngine extends TemplateEngine {
    options: MyEngineOptions;

    /**
     * renderFile must accept two parameters, a filename and local variabls 
     * passed to the template, and returns a promise, you can use 
     * AsyncFunction as well.
     */
    renderFile(filename: string, vars: {
        [name: string]: any
    } = {}): Promise<string> {
        // ...
    }
}
```

If you want more specific details, you can have a look at 
[sfn-ejs-engine](https://github.com/Hyurl/sfn-ejs-engine),
[sfn-pug-engine](https://github.com/Hyurl/sfn-pug-engine), 
[sfn-nunjucks-engine](https://github.com/Hyurl/sfn-nunjuncks-engine) and 
[sfn-sdopx-engine](https://github.com/Hyurl/sfn-sdopx-engine), see what 
they really do in the adapter.

### Appendix: Using Layout (A.K.A `extends`) In EJS Engine

By default, EJS doesn't support layout (A.K.A. template `extends`), but this 
engine provides that ability for you.

If you wish to use a layout template in the target template, just add a 
comment with format `<!-- layout: filename -->` at first row and first column 
in the template, just like this:

```html
<!-- layout: ./layout -->
<p>
    This is the target template.
</p>
```

And in the layout template, use variable `$LayoutContents` to attach the 
target template, just like this (uses tag `<%-` instead of `<%=`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <%- $LayoutContents %>
</body>
</html>
```

And when the target template is being rendered, it would output the contents 
as the following one:

```html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <p>
        This is contents in a layout.
    </p>
</body>
</html>
```

Remember, this is just a trick in **SFN** framework, if you're using other 
frameworks, it wouldn't work, but you can still use the `include()` syntax to 
load relative templates, which suits most of the case already.