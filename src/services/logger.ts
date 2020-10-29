import * as Logger from "sfn-logger";
import { ModuleProxy } from "microse";

declare global {
    namespace app {
        interface Config {
            logger?: Logger.Options;
        }
        namespace services {
            const logger: ModuleProxy<LoggerService>;
        }
    }
}

export default class LoggerService extends Logger {
    constructor() {
        super({
            filename: app.ROOT_PATH + "/logs/sfn.log",
            ttl: 1000,
            fileSize: 1024 * 1024 * 2,
            trace: false,
            ...app.config.logger
        });
        this.dateFormat = "YYYY-MM-DD HH:mm:ss";
    }

    async destroy() {
        await this.close();
    }

    async debug(...msg: any[]) {
        return super.debug(...msg);
    }

    async error(...msg: any[]) {
        return super.error(...msg);
    }

    async info(...msg: any[]) {
        return super.info(...msg);
    }

    async log(...msg: any[]) {
        return super.log(...msg);
    }

    async warn(...msg: any[]) {
        return super.warn(...msg);
    }
}
