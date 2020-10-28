<!-- title: HttpException; order: 10 -->

## HttpException

An exception indicates that the web server encounters an error, either from the
client-side or the server-side.

```ts
class HttpException extends Error { }
```

- [\<Error\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)

## 属性

- `code` \<number\> The HTTP status code.

## 方法

### constructor

```ts
constructor(code: number, message?: string);
```

### from

Constructs an HttpException from the given error.

```ts
static from(err: any): HttpException;
```
