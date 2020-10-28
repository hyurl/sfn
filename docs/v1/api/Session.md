<!-- title: Session; order: 14 -->

## Session

```ts
interface Session extends Express.Session { }
abstract class Session { }
```

- [\<Express.Session\>](https://github.com/expressjs/session#reqsession)

## Properties

- `csrfTokens` \<object\> This property stores all CSRF tokens of the current
    session, tokens will be deleted automatically after the validation is
    finished.
