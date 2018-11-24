<!-- title: E-mail; order: 15 -->
# Concept

[sfn-mail](https://github.com/hyurl/sfn-mail) is a very simple wrapper of 
[NodeMailer](https://github.com/nodemailer/nodemailer) for **SFN** framework 
to send e-mails.

## How To Use?

### Configuration

You must configure properly before you can actually send an e-mail, modify 
your configuration file `config.ts`, set a proper host and port, username, 
password, etc.

```typescript
export const conifg: SFNConfig = {
    // ...
    mail: {
        pool: true,
        host: "example.com",
        port: 25,
        secure: false,
        from: "my-address@example.com",
        auth: {
            username: "my-username",
            password: "my-password"
        }
    },
    // ...
}
```

After the configuring is done, at where you want to send e-mail, just 
instantiate a new mail from the `Mail` class, this example shows you how.

### Example

```typescript
import { HttpController, Request, route, Mail, HttpError } from "sfn";

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

As usual, you must learn [sfn-mail](https://github.com/hyurl/sfn-mail) on 
GitHub on your own, this page just give you a brief intro and example.