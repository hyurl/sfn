import hash = require("string-hash");
import { ROOT_PATH } from '../../init';
import { traceModulePath } from './internal/module';

export interface TaskOptions {
    /** 
     * The salt must be unique and predictable for each task, so that when the
     * module is reloaded, the new task can override the ole one, to keep there 
     * being only one task alive doing the same job.
     */
    salt: string;
    /** A Unix timestamp to suggest when should the task starts running. */
    start: number;
    /** A Unix timestamp to suggest when should the task stops running. */
    end?: number;
    /** A Unix timestamp to suggest how often should the task runs repeatedly. */
    repeat?: number;
}

export interface ScheduleTask {
    serverId: string;
    taskId: number;
    start: number;
    end?: number;
    repeat?: number;
    expired?: boolean;
}

export class Schedule {
    constructor(readonly name: string) { }

    /**
     * Creates a new schedule task according to the options and returns the task
     * ID. NOTE: the minimum tick interval of the schedule service is `1000`ms. 
     */
    create(options: TaskOptions, handler: Function): number {
        let { salt, start, end, repeat } = options;
        let taskId = hash(app.serverId + traceModulePath(ROOT_PATH) + salt);
        let event = String(taskId);

        app.message.unsubscribe(event);
        app.message.subscribe(event, handler);

        // Redirect the task to one of the schedule server.
        app.services.schedule.instance(event).add({
            taskId,
            repeat,
            start,
            end,
            serverId: app.serverId
        });

        return taskId;
    }

    /** Cancels a task according to the given task ID. */
    cancel(taskId: number) {
        let event = String(taskId);
        app.message.unsubscribe(event);
        app.services.schedule.instance(event).delete(taskId);
    }
}

export class ScheduleService {
    private timer: NodeJS.Timer;
    private tasks = new Map<number, ScheduleTask>();

    constructor() {
        this.add({
            serverId: app.serverId,
            taskId: -1,
            repeat: 1000 * 60 * 30,
            start: Date.now()
        });

        this.timer = setInterval(() => {
            let now = Date.now();

            for (let [taskId, task] of this.tasks) {
                let { start, end, expired, serverId, repeat } = task;

                if (!expired && now >= start) {
                    if (!end || now < end) {
                        if (taskId === -1 && serverId === app.serverId)
                            this.gc(now);
                        else
                            app.message.publish(String(taskId), 1, [serverId]);

                        if (repeat)
                            task.start += task.repeat;
                        else
                            task.expired = true;
                    } else {
                        task.expired = true;
                    }
                }
            }
        }, 1000);
    }

    stop() {
        clearInterval(this.timer);
    }

    private async gc(now: number) {
        for (let [taskId, task] of this.tasks) {
            if (task.expired || (task.end && now >= task.end)) {
                this.tasks.delete(taskId);
            }
        }
    }

    add(task: ScheduleTask) {
        this.tasks.set(task.taskId, { ...task, expired: false });
        return true;
    }

    delete(taskId: number) {
        return this.tasks.delete(taskId);
    }
}

export default ScheduleService;