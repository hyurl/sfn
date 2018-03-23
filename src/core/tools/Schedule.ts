import * as cron from "node-cron";
import { Service } from "./Service";

/**
 * A cron patterned task scheduler.
 * @see https://www.npmjs.com/package/node-cron
 */
export abstract class Schedule extends Service {
    cron: string;
    autoStart: boolean;
    protected task: cron.ScheduledTask;

    /**
     * @param cron The cron pattern.
     * @param autoStart If `true`, when create a `new Schedule`, it will be 
     *  automatically started.
     */
    constructor(cron?: string, autoStart = false) {
        super();
        this.cron = cron;
        this.autoStart = autoStart;

        if (!(this.run instanceof Function)) {
            throw new ReferenceError(this.constructor.name + ".run() is not implemented.");
        }

        process.nextTick(() => {
            if (this.autoStart)
                this.start();
        });
    }

    /** The runnable body of the schedule. */
    abstract run();

    start() {
        this.task = cron.schedule(this.cron, () => {
            this.run();
        });
        this.run(); // run the body at beginning.
        this.task.start();
    }

    stop() {
        if (!this.task)
            throw new ReferenceError("The schedule hasn't started.");

        this.task.stop()
    }

    destory() {
        if (!this.task)
            throw new ReferenceError("The schedule hasn't started.");

        this.task.destroy();
    }
}