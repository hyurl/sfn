import * as Logger from "sfn-logger";

declare global {
    namespace app {
        namespace services {
            const logger: ModuleProxy<LoggerService>;
        }
    }
}


export default class LoggerService {
    protected logger: Logger = null;

    setUp(options?: Logger.Options) {
        this.logger = new Logger(Object.assign({}, Logger.Options, {
            ttl: 1000,
            fileSize: 1024 * 1024 * 2,
            trace: false
        }, options));
    }

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
}