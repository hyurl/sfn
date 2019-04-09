import { Service } from "sfn";
import * as Mail from "sfn-mail";

declare global {
    namespace app {
        interface Config {
            /** @see https://github.com/Hyurl/sfn-mail */
            mail?: Mail.Options & Mail.Message;
        }
        namespace services {
            const mail: ModuleProxy<MailService>;
        }
    }
}

const env = process.env;

app.config.mail = Object.assign({
    pool: false,
    host: env.MAIL_HOST || "smtp.gmail.com",
    port: parseInt(env.MAIL_PORT) || 25,
    secure: false,
    from: env.MAIL_FROM || "",
    auth: {
        username: env.MAIL_USER || "",
        password: env.MAIL_PASS || ""
    }
}, app.config.mail);

export default class MailService extends Service {
    send(options: app.Config["mail"]) {
        return new Mail(this.processMessage(options)).send();
    }

    private processMessage(options: app.Config["mail"]) {
        options.subject && (options.subject = this.i18n(options.subject));
        options.text && (options.text = this.i18n(options.text));
        options.html && (options.html = this.i18n(options.html));
        return options;
    }

    static getInstance() {
        let ins = new this;
        Mail.init(ins.processMessage(app.config.mail)); // initiate mail configurations
        return ins;
    }
}