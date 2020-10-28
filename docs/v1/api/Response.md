<!-- title: Response; order: 12 -->

## Response

```ts
interface Response extends webium.Response { }
abstract class Response { }
```

- [\<webium.Response\>](https://github.com/hyurl/webium#response)

## 属性

- `gzip` \<boolean\> Whether the response data should be compressed to GZIP.
- `sent` \<boolean\> Whether the response has been sent. Because the framework
    uses package `express-session`, which will delay changing the property
    `res.finished`, so after calling `res.end()`, `res.send()`, `res.redirect()`,
    the `res.finished` will still be `false`, so if you want to check if the
    response has been sent, check `res.sent` instead.
- `sse` [\<SSE\>](https://github.com/hyurl/sfn-sse/blob/master/src/index.ts#L14)
    The Sever-Sent Events channel of the response.

## 方法

### xml

Sends data to the client as an XML document.

```ts
xml(data: { [key: string]: any; }, rootTag?: string, headless?: boolean): void;
```

