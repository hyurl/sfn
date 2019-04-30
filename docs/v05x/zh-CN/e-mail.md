<!-- title: 电子邮件; order: 15 -->
# 基本概念

[sfn-mail](https://github.com/hyurl/sfn-mail) 对 
[NodeMailer](https://github.com/nodemailer/nodemailer) 模块进行了一些的封装，
以便在 **SFN** 框架中发送邮件。

## 如何使用？

### 初始化

你必须要在真的发送邮件之前进行合适的配置，例如设置合适的主机名和端口，以及用户名、密码等等。

```typescript
// bootstrap/index.ts
import * as Mail from "sfn-mail";

Mail.init({
    pool: true,
    host: "example.com",
    port: 25,
    secure: false,
    from: "my-address@example.com",
    auth: {
        username: "my-username",
        password: "my-password"
    }
});
```

当配置完成之后，在你想要发送邮件的地方，只需要从 `Mail` 类实例化一个新的邮件，这个
示例将会告诉你如何做。

## 示例

```typescript
import { HttpController, Request, route, HttpError } from "sfn";
import * as Mail from "sfn-mail";

export default class extends HttpController {
    @route.post("/send-email")
    async sendEmail(req: Request) {
        let mail = new Mail("Subject of a new e-mail");
        
        mail.to("reciever@example.com")
            .text("This is the text version of contents.")
            .html("<p>You could also send a HTML version.</p>");

        try {
            let res = await mail.send();
            return this.success("E-mail has been sent.");
        } catch (e) {
            throw new HttpError(500, e.message);
        }
    }
}
```

和往常一样，你必须要自己到 GitHub 上学习 
[sfn-mail](https://github.com/hyurl/sfn-mail) 模块的知识，这个页面只会给你一个
简单的介绍和示例。