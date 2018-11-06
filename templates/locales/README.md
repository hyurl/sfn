This folder stores language packages, each package are named in RFC1766 
standard, both js and json files are supported.

JavaScript (zh-CN.ts):

```typescript
import { Locale } from "sfn";

export const zhCN: Locale = {
    "Hello, World!": "你好，世界！"
}
```

JSON (zh-CN.json):

```json
{
    "Hello, World!": "你好，世界！"
}
```

Short-hand for default language:

```json
[
    "hello, World!"
]
```