<!-- title: HttpException; order: 3 -->

## HttpException

An exception indicates that the web server encounters an error, either from the
client-side or the server-side.

```ts
class HttpException extends Error { }
```

## 属性

- `code: number` The HTTP status code.

## 方法

### constructor

Create an instance.

```ts
constructor(code: number, message?: string);
```

### from

Constructs an HttpException from the given error.

```ts
static from(err: any): HttpException;
```
