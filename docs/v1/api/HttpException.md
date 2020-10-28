<!-- title: HttpException; order: 15.1 -->

## HttpException

An exception indicates that the web server encounters an error, either from the
client-side or the server-side.

```ts
class HttpException extends Error { }
```

- [\<Error\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)

## Properties

- `code` \<number\> The HTTP status code.

## Methods

### constructor

```ts
constructor(code: number, message?: string);
```

### from

Constructs an HttpException from the given error.

```ts
static from(err: any): HttpException;
```
