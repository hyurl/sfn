import * as path from "path";
import * as fs from "fs-extra";
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
            serverId: app.serverId,
            start,
            repeat,
            end,
        });

        return taskId;
    }

    /** Cancels a task according to the given task ID. */
    cancel(taskId: number) {
        if (!taskId)
            return;

        let event = String(taskId);
        app.message.unsubscribe(event);
        app.services.schedule.instance(event).delete(taskId);
    }
}

export class ScheduleService {
    private timer: NodeJS.Timer = null;
    private tasks = new Map<number, ScheduleTask>();
    private filename = app.ROOT_PATH + `/cache/schedules-${app.serverId}.json`;
    private state: "running" | "stopped";

    constructor() {
        this.setup().add({
            taskId: -1,
            serverId: app.serverId,
            start: Date.now(),
            repeat: 1000 * 60 * 30
        });
    }

    async add(task: ScheduleTask) {
        this.tasks.set(task.taskId, { ...task, expired: false });
        return true;
    }

    async delete(taskId: number) {
        return this.tasks.delete(taskId);
    }

    /** Stops the schedule service. */
    async stop(transferTasks = false) {
        if (this.state === "stopped") {
            return;
        } else {
            this.state = "stopped";
        }

        // Run garbage collection to remove expired tasks before caching.
        await this.clear().gc();

        let tasks: [number, ScheduleTask][] = [];
        let mod = app.services.schedule;
        let { local } = app.services;

        for (let [taskId, task] of this.tasks) {
            if (taskId <= 0) // do not deal with internal tasks
                continue;

            this.tasks.delete(taskId);

            if (transferTasks && mod.instance(taskId) !== mod.instance(local)) {
                mod.instance(taskId).add(task);
            } else {
                tasks.push([taskId, task]);
            }
        }

        if (!transferTasks && tasks.length) {
            await fs.ensureDir(path.dirname(this.filename));
            await fs.writeJSON(this.filename, tasks);
        }
    }

    /** Recovers cached schedules from the previous shutdown. */
    async resume() {
        this.state === "stopped" && this.setup();

        try {
            let tasks: [number, ScheduleTask][] = await fs.readJSON(this.filename);

            for (let [taskId, task] of tasks) {
                this.tasks.set(taskId, task);
            }
        } catch (e) { }
    }

    private setup() {
        this.clear().state = "running";
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
                            task.start = now + task.repeat;
                        else
                            task.expired = true;
                    } else {
                        task.expired = true;
                    }
                }
            }
        }, 1000);

        return this;
    }

    private clear() {
        this.timer && clearInterval(this.timer);
        return this;
    }

    private async gc(now?: number) {
        now = now || Date.now();

        for (let [taskId, task] of this.tasks) {
            if (task.expired || (task.end && now >= task.end)) {
                this.tasks.delete(taskId);
            }
        }
    }
}

export default ScheduleService;