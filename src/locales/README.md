This folder stores language packages, each package are named in RFC1766 standard,
and exports a default object.

```typescript
// SRC_PATH/locales/zh-CN.ts
import { Locale } from "sfn";

export default <Locale>{
    "Hello, World!": "你好，世界！"
}
```