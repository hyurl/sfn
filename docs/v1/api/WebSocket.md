<!-- title: WebSocket; order: 13 -->

# WebSocket

```ts
interface WebSocket extends SocketIO.Socket { }
abstract class WebSocket { }
```

- [\<SocketIO.Socket\>](https://socket.io/docs/server-api/#Socket)

## 属性

- `domainName` \<string\> The domain name of the handshake request.
- `subdomain` \<string\> The subdomain name of the handshake request.
- `cookies` \<object\> The cookies of the handshake request.
- `session` [\<Session\>](./Session) The session object of the current socket.
- `proxy` \<object\> The proxy information of handshake request.
    - `protocol` \<string\>
    - `host` \<string\>
    - `ips` \<string[]\>
    - `ip` \<string\>
- `protocol` \<string\> The protocol of the socket, either `ws` or `wss`.
- `hostname` \<string\>
- `port` \<number\>
- `host` \<string\> Contain both `host` and `port`.
- `ip` \<string\> The remote IP of the socket.
- `ips` \<string\>
- `lang` \<string\> The language that the client uses.
- `langs` \<string[]\> All languages that the client accepts.
- `secure` \<boolean\> Whether the connection uses SSL/TSL.
