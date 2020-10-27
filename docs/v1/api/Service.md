<!-- title: Service; order: 1 -->

## Service

The `Service` class provides some useful functions like `i18n`, `logger`, 
`cache` that you can use to do real jobs, and since it is inherited from 
EventEmitter, you can bind customized events if needed.

This class is not intended to be used directly, to use its functions, a new
class must be defined and inherited from this one.

```ts
abstract class Service extends EventEmitter { }
```

## 属性

- `lang: string` The language of the current service, the default value is
    `app.config.lang`, but for controllers, this property is set automatically
    according to the client supported language.

## 方法

### gc

This method will be called automatically once the garbage collector ticks.

```ts
protected gc(): Promise<void>;
```

### init

This method will be called automatically to initiate the service.

```ts
init(): Promise<void>;
```

### destroy

This method will be called automatically when the service is about to be
destroyed.

```ts
destroy(): Promise<void>;
```

### i18n

Gets a locale text according to i18n. 

If it's an HTTP request, check `req.query.lang` or `req.cookies.lang`, if it's
a socket message, check `socket.cookies.lang`, if any appears, then always use
the setting language, otherwise, check header `Accept-Language` instead.
Language files are stored in `src/locales/`.

```ts
i18n(text: string, ...replacements: string[]): string;
```

- `text` The original text, accept format with %s, %i, etc.
- `replacements` Values that replace %s, %i, etc. in the `text`.

### throttle

Uses throttle strategy on the given resource, if a subsequent call happens
within the `interval` time, the previous result will be returned and the current
`handle` function will not be invoked.

NOTE: this function only uses `interval` once for creating the internal throttle
function.

```ts
throttle<T>(resource: any, handle: () => T | Promise<T>, interval = 1000): Promise<T>;
```

### queue

Uses queue strategy on the given resource, any subsequent call will be queued
until the previous one finishes.

```ts
queue<T>(resource: any, handle: () => T | Promise<T>): Promise<T>;
```
