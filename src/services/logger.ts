import * as Logger from "sfn-logger";

declare global {
    namespace app {
        interface Config {
            logger?: Logger.Options
        }
        namespace services {
            const logger: ModuleProxy<LoggerService>;
        }
    }
}

export default class LoggerService {
    protected logger: Logger = null;

    async debug(...msg: any[]) {
        this.logger.debug(...msg);
    }

    async error(...msg: any[]) {
        this.logger.error(...msg);
    }

    async info(...msg: any[]) {
        this.logger.info(...msg);
    }

    async log(...msg: any[]) {
        this.logger.log(...msg);
    }

    async warn(...msg: any[]) {
        this.logger.warn(...msg);
    }

    close(waitTime?: number) {
        return new Promise((resolve, reject) => {
            this.logger.close(resolve, waitTime);
        });
    }

    static getInstance() {
        let service = new this;

        service.logger = new Logger({
            filename: app.ROOT_PATH + "/logs/sfn.log",
            ttl: 1000,
            fileSize: 1024 * 1024 * 2,
            trace: false,
            ...app.config.logger
        });

        return service;
    }
}