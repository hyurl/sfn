export interface TaskOptions {
    /** 
     * In a process, the task ID must be unique for each task, so that when the
     * module is reloaded, the new task can override the ole one, to keep there 
     * being only one task alive doing the job.
     */
    taskId: string;
    /** A Unix timestamp to suggest when should the task starts running. */
    start: number;
    /** A Unix timestamp to suggest when should the task stops running. */
    end?: number;
    /** A Unix timestamp to suggest how often should the task runs repeatedly. */
    repeat?: number;
}

export interface ScheduleTask extends TaskOptions {
    serverId: string;
    expired?: boolean;
}

export class Schedule {
    constructor(readonly name: string) { }

    /**
     * Creates a new schedule task according to the options and returns the task
     * ID. NOTE: the minimum tick interval of the schedule service is `1000`ms. 
     */
    create(options: TaskOptions, handler: Function): string {
        let { taskId, start, end, repeat } = options;

        app.message.unsubscribe(taskId);
        app.message.subscribe(taskId, this.createMessageListner(handler));

        // Redirect the task to one of the schedule server.
        app.services.schedule.instance(taskId).add({
            taskId,
            repeat,
            start,
            end,
            serverId: app.serverId
        });

        return taskId;
    }

    /** Cancels a task according to the given task ID. */
    cancel(taskId: string) {
        app.message.unsubscribe(taskId);
        app.services.schedule.instance(taskId).delete(taskId);
        return true;
    }

    private createMessageListner(handler: Function) {
        return async (serverId: string) => {
            if (serverId === app.serverId) {
                await handler();
            }
        };
    }
}

export class ScheduleService {
    private timer: NodeJS.Timer;
    private tasks = new Map<string, ScheduleTask>();

    constructor() {
        this.add({
            serverId: app.serverId,
            taskId: "gc",
            repeat: 1000 * 60 * 30,
            start: Date.now()
        });

        this.timer = setInterval(() => {
            let now = Date.now();

            for (let [taskId, task] of this.tasks) {
                let { start, end, expired, serverId, repeat } = task;

                if (!expired && now >= start) {
                    if (!end || now < end) {
                        if (taskId === "gc" && serverId === app.serverId)
                            this.gc(now);
                        else
                            app.message.publish(taskId, serverId);

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

    delete(taskId: string) {
        return this.tasks.delete(taskId);
    }
}

export default ScheduleService;