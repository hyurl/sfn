<!-- title: Request; order: 11 -->

# Request

```ts
interface Request extends webium.Request { }
abstract class Request { }
```

- [\<webium.Request\>](https://github.com/hyurl/webium#request)

## 属性

- `isEventSource` \<boolean\> Whether the request comes from an EventSource
    client.
- `csrfToken` \<string\> Gets the CSRF token if available.
- `session` [\<Session\>](./Session) The session object of the current request.
- `sign` \<string\> An MD5 string representing the identical signature of the
    request.
- `shortUrl` \<string\> A short-version URL, when the URL contains more than 64
    characters, the rest part will be cut off and replaced with `...`.
- `files` \<object\> When in the controller constructor, the files are in
    uploading state, when in the method bound to the route, the files are
    uploaded and stored in disk.
    - [UploadedFile](./UploadedFile)
    - [UploadingFile](./UploadedFile#UploadingFile)
