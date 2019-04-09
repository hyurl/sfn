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

    debug(...msg: any[]) {
        this.logger.debug(...msg);
    }

    error(...msg: any[]) {
        this.logger.error(...msg);
    }

    info(...msg: any[]) {
        this.logger.info(...msg);
    }

    log(...msg: any[]) {
        this.logger.log(...msg);
    }

    warn(...msg: any[]) {
        this.logger.warn(...msg);
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