<!-- title: HttpController; order: 8 -->

## HttpController

HttpController manages requests come from an HTTP client.

When a request fires, the controller will be automatically instantiated and
calling the bound method according to the route.

```ts
abstract class HttpController extends Controller { }
```

- [\<Controller\>](./Controller)

## Properties

- `req` [\<Request\>](./Request) The current request context.
- `res` [\<Response\>](./Response) The current response context.
- `fallbackTo` \<string\> | [\<ResultMessage\>](./Controller#ResultMessage)
    If set, when unauthorized, fallback to the given URL or response an error
    message.
- `gzip` \<boolean\> Whether the response data should be compressed to GZip,
    default `true`.
- `jsonp` \<string\> | \<boolean\> Sets a query name for jsonp callback, or
    `false` (by default) to disable.
- `csrfProtection` \<boolean\> If `true`, when the request method is `DELETE`,
    `PATCH`, `POST` or `PUT`, the client must send an `x-csrf-token` field to
    the server either via request header, URL query string or request body. You
    can call `req.csrfToken` to get the auto-generated token in a `GET` action
    and pass it to a view.
- `uploadOptions` [\<UploadOptions\>](#UploadOptions) Configurations for uploading files.
- `url` \<string\> alias of `req.url`.
- `session` [\<Session\>](./Session) alias of `req.session`.
- `sse` [\<SSE\>](https://github.com/hyurl/sfn-sse/blob/master/src/index.ts#L14)
    Alias of `res.sse`.
- `isEventSource` \<boolean\> alias of `req.isEventSource`.
- `csrfToken` \<string\> Alias of `req.csrfToken`.
- static `baseURI` \<string\> Sets a specified base URI for route paths.
- static `cors` \<string\> | \<string[]\> |
    [\<CorsOptions\>](https://github.com/hyurl/sfn-cors/blob/master/index.d.ts#L51)
    Enables Cross-Origin Resource Sharing, set an array to accept multiple
    origins, an `*` to accept all, or an object for more complicated needs.

## Methods

### constructor

```ts
constructor(req: Request, res: Response);
```

- [\<Request\>](./Request)
- [\<Response\>](./Response)

### view

Renders the template file to a string.

```ts
view(path: string, vars: { [name: string]: any; } = {}): string | Promise<string>;
```

- `path` The template path (without extension) related to `src/views`.
- `vars` Local variables passed into the template.

### send

Alias of `res.send`.

```ts
send(data: any): void;
```

### httpErrorView

By default, the framework will send a view file according to the error code, and
only pass the error object ([HttpException](./HttpException)) into the template,
it may not be suitable for complicated needs. For such a reason, the framework
allows you to customize the error view handler by rewriting this method.

```ts
static httpErrorView(
    err: HttpException,
    instance: HttpController
): string | Promise<string>;
```

## UploadOptions

```ts
type UploadOptions = {
    /** Maximum number of files that each form field can carry. */
    maxCount?: number;
    /** A path in the disk that stores the uploaded files. */
    savePath?: string;
    /** Returns `true` to accept, `false` to reject. */
    filter?: (file: UploadingFile) => boolean;
    /** `auto-increment`, `random` or a function returns the filename. */
    filename?: "auto-increment" | "random" | ((file: UploadingFile) => string);
};
const UploadOptions: UploadOptions;
```

## UploadingFile

```ts
interface UploadingFile {
    /** Field name specified in the form. */
    fieldname: string;
    /** Name of the file on the user's computer. */
    originalname: string;
    /** Encoding type of the file. */
    encoding: string;
    /** Mime type of the file. */
    mimetype: string;
}
```

## UploadedFile

```ts
interface UploadedFile extends UploadingFile {
    /** The folder to which the file has been saved. */
    destination: string;
    /** The name of the file within the destination. */
    filename: string;
    /** Location of the uploaded file. */
    path: string;
    /** Size of the file in bytes. */
    size: number;
}
```
