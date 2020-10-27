<!-- title: HttpException; order: 3 -->

## HttpException

An exception indicates that the web server encounters an error, either from the
client-side or the server-side.

```ts
class HttpException extends Error { }
```

## 方法

### from

Constructs an HttpException from the given error.

```ts
static from(err: any): HttpException;
```
