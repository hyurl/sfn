<!-- title: Uploading; order: 12 -->
## Concept

The [HttpController](/api/v1/HttpController) provides a simple uploading method
that let you upload files via a POST request.

## Example

In an HttpController, use the decorator [@upload](/api/v1/decorators#upload) to
set accept fields that may contain files.

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

## Configure Uploading Options

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

The `uploadOptions` is an [UploadOptions](/api/v1/HttpController#UploadOptions),
which contains these properties:

- `maxCount` Maximum number of files that each form field can carry (default:
     `1`).
- `savePath` A path in the disk that stores the uploaded files (default: 
    `uploads/`), in the directory, files are separated by date.
- `filter` A callback function, returns `true` to accept, `false` to reject.
- `filename` Could be `auto-increment` (by default), `random` or a function 
    returns the filename. `auto-increment` indicates when the filename exists,
    it will be suffixed with a number, e.g. `example.txt` => `example (1).txt`.

## The File State

The file state in the constructor and the route-binding method is different, in 
the constructor (also in the 
[init()](./http-controller#Before-And-After-Operations) method), the file is in
uploading state, while in the method, it's uploaded.

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
