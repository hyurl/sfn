import * as path from "path";
import * as fs from "fs-extra";
import hash = require("string-hash");
import { ROOT_PATH } from '../../init';
import { traceModulePath } from './internal/module';
import moment = require('moment');

export interface TaskOptions<T = any> {
    /** A Unix timestamp to suggest when should the task starts running. */
    start: number;
    /** A Unix timestamp to suggest when should the task stops running. */
    end?: number;
    /**
     * A number of seconds to suggest how often should the task runs
     * repeatedly.
     */
    repeat?: number;
    /** 
     * The salt must be unique and predictable for each task, so that when the
     * module is reloaded, the new task can override the ole one, to keep there 
     * being only one task alive doing the same job.
     */
    salt?: string;
    /**
     * If provided, the schedule will be bound to a specified `module` and must
     * provide the `handler` a method of the module instance.
     */
    module?: ModuleProxy<T>;
    /**
     * A callback function or a method name of the `module` instance (if 
     * provided). 
     */
    handler?: ((data: any) => void) | keyof FunctionProperties<T>;
    /**
     * The data passed to the handler as arguments, note that the data will be
     * jsonified for transmission, anything that cannot be jsonified will be
     * lost during transmission.
     */
    data?: any[]
}

export interface ScheduleTask {
    serverId: string;
    taskId: number;
    start: number;
    end?: number;
    repeat?: number;
    expired?: boolean;
    module?: string;
    handler?: string;
    data?: any[]
}

export class Schedule {
    constructor(readonly name: string) { }

    /**
     * Creates a new schedule task according to the options and returns the task
     * ID. NOTE: the minimum tick interval of the schedule service is `1000`ms. 
     */
    create(options: TaskOptions, handler: (data: any) => void): number;
    create<T>(options: TaskOptions<T>): number;
    create(options: TaskOptions, handler?: Function | string): number {
        let { salt, start, end, repeat, module, data } = options;
        let idParam: string[] = [app.serverId, traceModulePath(ROOT_PATH)];
        let isMethod = false;
        let isCallable = false;

        salt && idParam.push(salt);
        module && idParam.push(module.name);
        handler = handler || options.handler;

        if (handler) {
            if (typeof handler === "string") {
                isMethod = true;
                idParam.push(handler);
            } else {
                isCallable = true;
                handler.name && idParam.push(handler.name);
            }
        }

        if (idParam.length < 3) {
            throw new TypeError(
                "not enough options for scheduling, try providing a salt"
            );
        } else if (module && typeof handler !== "string") {
            throw new TypeError(
                "handler is missing or not a method of the module"
            );
        }

        // Compatible fix with milliseconds
        if (String(start).length === 13) {
            start = Math.round(start / 1000);

            if (repeat) {
                repeat = Math.ceil(repeat / 1000);
            }
        }

        let taskId = hash(idParam.join("#"));
        let event = String(taskId);

        // If the handler is provided a callable function, directly subscribe 
        // the event using the handler.
        // Otherwise, the schedule will be delivered to an internal subscriber
        // which listens all potential schedule task published.
        if (isCallable) {
            app.message.unsubscribe(event);
            app.message.subscribe(event, <Function>handler);
        }

        // Redirect the task to one of the schedule server.
        app.services.schedule.instance(event).add({
            taskId,
            serverId: app.serverId,
            start,
            repeat,
            end,
            module: module && module.name,
            handler: isMethod ? <string>handler : void 0,
            data
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
            start: moment().unix(),
            repeat: 60 * 30
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

        let tasks: ScheduleTask[] = [];
        let mod = app.services.schedule;
        let { local } = app.services;

        for (let [taskId, task] of this.tasks) {
            if (taskId <= 0) // do not deal with internal tasks
                continue;

            this.tasks.delete(taskId);

            if (transferTasks && mod.instance(taskId) !== mod.instance(local)) {
                mod.instance(taskId).add(task);
            } else {
                tasks.push(task);
            }
        }

        if (!transferTasks) {
            await fs.ensureDir(path.dirname(this.filename));
            await fs.writeJSON(this.filename, tasks);
        }
    }

    /** Recovers cached schedules from the previous shutdown. */
    async resume() {
        this.state === "stopped" && this.setup();

        try {
            let tasks: ScheduleTask[] = await fs.readJSON(this.filename);

            for (let task of tasks) {
                // compatible with old version
                Array.isArray(task) && (task = task[1]);

                this.tasks.set(task.taskId, task);
            }
        } catch (e) { }
    }

    private setup() {
        this.clear().state = "running";
        this.timer = setInterval(() => {
            let now = moment().unix();

            for (let [taskId, task] of this.tasks) {
                let { start, end, expired, serverId, repeat, data } = task;

                if (!expired && now >= start) {
                    if (!end || now < end) {
                        if (taskId === -1 && serverId === app.serverId) {
                            this.gc(now);
                        } else if (!task.handler) {
                            app.message.publish(String(taskId), data, [serverId]);
                        } else {
                            app.message.publish(app.schedule.name, [
                                task.module,
                                task.handler,
                                data
                            ], [serverId]);
                        }

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
        now = now || moment().unix();

        for (let [taskId, task] of this.tasks) {
            if (task.expired || (task.end && now >= task.end)) {
                this.tasks.delete(taskId);
            }
        }
    }
}

export default ScheduleService;