<!-- title: 文件上传; order: 12 -->
## 基本概念

[HttpController](/api/v1/HttpController) 提供了一个简单的文件上传方式，让你可以通过
POST 请求来上传文件。上传文件就如同你做其他事情一样容易，只需要一些简单的配置，其余的工作就能够
被框架自动处理。

## 使用示例

在一个 HttpController 中，使用装饰器 [@upload](/api/v1/decorators#upload) 来设置接受携带文件的字段。

```typescript
import { HttpController, Request, route, upload } from "sfn";

export default class extends HttpController {

    @route.post("/upload")
    @upload("field1", "field2")
    upload(req: Request) {
        // The req.files property will carry the uploaded files,
        // each field may carry several files.
        console.log(req.files.field1[0]);
        console.log(req.files.field2[0]);
    }
}
```

## 配置上传选项

```typescript
import { HttpController, Request, Response, route, upload } from "sfn";

export default class extends HttpController {

    constructor(req: Request, res: Response) {
        super(req, res);

        // Set each field to carry no more than 5 files.
        this.uploadOptions.maxCount = 5;

        // Set the uploaded filename (extension exclusive) to be a random 
        // string.
        this.uploadOptions.filename = "random";
    }
}
```

`uploadOptions` 是一个 [UploadOptions](/api/v1/HttpController#UploadOptions) 类型，
它包含着这些属性：

- `maxCount` 每一个表单字段允许携带文件的最大数量（默认 `1`）。
- `savePath` 硬盘中用来存储已上传文件的路径(默认 `uploads/`)，在目录中，文件被按
    日期分别存储。
- `filter` 一个回调函数，返回 `true` 表示接受，`false` 表示拒绝。
- `filename` 可以是 `auto-increment`（默认地），`random` 或者一个函数来返回文件名。 
    `auto-increment` 表示当文件名已存在时，它将会使用一个递增的数字来作为后缀，例如
    `example.txt` => `example (1).txt`。

## 文件状态

在构造函数中的文件状态和绑定到路由的方法中的状态是不同的，在构造函数中（以及在 
[init()](./http-controller#前置和后置操作) 方法中），文件处于正在上传状态，而在
方法中，它已经上传完成了。

```typescript
import { HttpController, Request, Response, UploadingFile } from "sfn";

export default class extends HttpController {

    constructor(req: Request, res: Response) {
        super(req, res);

        this.uploadOptions.filter = (file: UploadingFile) => {
            // Do not try to access `req.files` in the constructor, it's 
            // undefined because the file is not yet uploaded.
            // ...
        }
    }
}
```
