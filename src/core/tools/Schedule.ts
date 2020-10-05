import * as path from "path";
import * as fs from "fs-extra";
import md5 = require("md5");
import omit = require("lodash/omit");
import timestamp from "@hyurl/utils/timestamp";
import sift, { Query as SiftQuery } from "sift";

type Methods<T> = FunctionPropertyNames<T>;

/** @deprecated */
export type TaskOptions = FunctionTaskOptions<any> | ModuleTaskOptions<any, string>;
export type TaskHandler = (...data: any[]) => void | Promise<void>;
export type ScheduleQuery<T> = Partial<SiftQuery> & {
    appId?: string | RegExp;
    taskId?: string | RegExp;
    start?: string | number | Date;
    end?: string | number | Date;
    repeat?: number;
    module?: ModuleProxy<T> | string | RegExp;
    handler?: Methods<T> | RegExp;
    onEnd?: Methods<T> | RegExp;
};

export interface ScheduleOptions {
    /**
     * A UNIX timestamp, date-time string or Date instance of when should the
     * task starts running.
     */
    start?: number | string | Date;
    /** If set, add the current UNIX timestamp and used as the start time. */
    startIn?: number;
    /**
     * A UNIX timestamp, date-time string or Date instance of when should the
     * task stops running.
     */
    end?: number | string | Date;
    /** If set, add the current UNIX timestamp and used as the end time. */
    endIn?: number;
    /**
     * A list of certain times of when should the task be running.
     * 
     * This property conflicts with `start` and `startIn` properties, and is of
     * the most priority.
     */
    timetable?: (number | string | Date)[];
    /**
     * A number of seconds of how often should the task be running repeatedly.
     */
    repeat?: number;
}

export interface ScheduleTask extends ScheduleOptions {
    appId: string;
    taskId: string;
    module?: string;
    handler?: string;
    onEnd?: string;
    data?: any[];
}

export interface BaseTaskOptions<F extends TaskHandler> extends ScheduleOptions {
    /** 
     * The salt must be unique and predictable for each task, so that when the
     * module is reloaded, the new task can override the ole one, to keep there 
     * being only one task alive doing the same job.
     */
    salt?: string;
    /**
     * The data passed to the handler as arguments, note that the data will be
     * jsonified for transmission, anything that cannot be jsonified will be
     * lost during transmission.
     */
    data?: Parameters<F>;
}

export interface FunctionTaskOptions<F extends TaskHandler> extends BaseTaskOptions<F> {
    handler?: F;
    onEnd?: (...data: Parameters<F>) => void | Promise<void>;
}

export interface ModuleTaskOptions<T, M extends Methods<T>> extends BaseTaskOptions<T[M]> {
    module?: ModuleProxy<T>;
    handler?: M;
    onEnd?: Methods<T>;
}

export class Schedule {
    constructor(readonly name: string) { }

    /**
     * Creates a new schedule task according to the options and returns the task
     * ID. NOTE: the minimum tick interval of the schedule service is `1000`ms. 
     */
    create<F extends TaskHandler>(
        options: BaseTaskOptions<F>,
        handler: F,
    ): string;
    create<F extends TaskHandler>(
        options: BaseTaskOptions<F>,
        handler: F,
        ensure: true
    ): Promise<string>;
    create<F extends TaskHandler>(options: FunctionTaskOptions<F>): string;
    create<F extends TaskHandler>(
        options: FunctionTaskOptions<F>,
        ensure: true
    ): Promise<string>;
    create<T, M extends Methods<T>>(options: ModuleTaskOptions<T, M>): string;
    create<T, M extends Methods<T>>(
        options: ModuleTaskOptions<T, M>,
        ensure: true
    ): Promise<string>;
    create(
        options: FunctionTaskOptions<TaskHandler> & ModuleTaskOptions<any, string>,
        handler: Function | string | boolean = null,
        ensure = false
    ): string | Promise<string> {
        let {
            salt,
            start,
            startIn,
            end,
            endIn,
            repeat,
            timetable,
            module,
            data,
            onEnd
        } = options;
        let params: string[] = [app.id];

        if (typeof handler === "boolean") {
            ensure = handler;
            handler = null;
        }

        salt && params.push(salt);
        module && params.push(module.name);
        handler = handler || options.handler;

        if (handler) {
            if (typeof handler === "string") {
                if (module) {
                    params.push(handler);
                } else {
                    throw new TypeError(
                        "'module' option must be provided " +
                        "when 'handler' is provided a string"
                    );
                }
            } else if ((<Function>handler).name) {
                params.push((<Function>handler).name);
            } else {
                let hash = md5(String(handler));

                if (!salt) {
                    salt = hash;
                    params.unshift(salt);
                }

                params.push(hash);
            }
        } else {
            throw new TypeError("'handler' must be provided for scheduling");
        }

        if (params.length < 3) {
            throw new TypeError(
                "not enough options for scheduling, try providing a 'salt'"
            );
        }

        // Compatible fix with milliseconds
        if (typeof start === "number" && String(start).length === 13 && repeat) {
            repeat = Math.ceil(repeat / 1000);
        }

        let taskId = md5(params.join("#"));
        let task: ScheduleTask = {
            taskId,
            appId: app.id,
            start,
            startIn,
            end,
            endIn,
            timetable,
            repeat,
            module: module && module.name,
            handler: typeof handler === "string" ? handler : void 0,
            onEnd: typeof onEnd === "string" ? onEnd : void 0,
            data
        };

        // If the handler is provided a callable function, directly subscribe 
        // the event using the handler.
        // Otherwise, the schedule will be delivered to an internal subscriber
        // which listens all potential schedule task published.
        if (typeof handler === "function") {
            app.message.unsubscribe(taskId);
            app.message.subscribe(taskId, (data: any[]) => {
                (<Function>handler).apply(void 0, data);
            });
        }

        if (typeof onEnd === "function") {
            app.message.unsubscribe(taskId + ".onEnd");
            app.message.subscribe(taskId + ".onEnd", (data: any[]) => {
                (<Function>onEnd).apply(void 0, data);
            });
        }

        if (ensure) {
            return app.services.schedule(taskId).add(task).then(() => taskId);
        } else {
            app.services.schedule(taskId).add(task);
            return taskId;
        }
    }

    /** Cancels a task according to the given task ID. */
    cancel(taskId: string): void;
    cancel(taskId: string, ensure: true): Promise<boolean>;
    cancel(taskId: string, ensure = false) {
        app.message.unsubscribe(taskId);

        if (ensure) {
            return app.services.schedule(taskId).delete(taskId);
        } else {
            app.services.schedule(taskId).delete(taskId);
        }
    }
}

export class ScheduleService {
    private timer: NodeJS.Timer = null;
    private state: "uninitiated" | "running" | "stopped" = "uninitiated";
    private tasks = new Map<string, ScheduleTask>();
    private filename = app.ROOT_PATH + `/cache/schedules-${app.id}.json`;

    /** @inner Use `app.schedule.create()` instead. */
    async add(task: ScheduleTask) {
        this.state === "uninitiated" && await this.init();
        let _task = this.tasks.get(task.taskId);

        if (task.timetable) {
            let now = timestamp();

            // Record initial value for comparison.
            task["_timetable"] = task.timetable.map(
                time => time instanceof Date ? time.toISOString() : String(time)
            );

            task.timetable = task.timetable
                .map(time => typeof time === "number" ? time : timestamp(time))
                .sort()
                .filter((time, i, table) => {
                    if (time < now) {
                        if (task.repeat) {
                            table[i] += task.repeat;
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return true;
                    }
                });
        } else {
            if (task.start) {
                // Record initial value for comparison.
                task["_start"] = task.start instanceof Date
                    ? task.start.toISOString()
                    : String(task.start);

                if (typeof task.start !== "number")
                    task.start = timestamp(task.start);
            } else if (task.startIn) {
                task.start = timestamp() + task.startIn;
            } else {
                task.start = timestamp();
            }
        }

        if (task.end && typeof task.end !== "number") {
            task.end = timestamp(task.end);
        } else if (task.endIn) {
            task.end = timestamp() + task.endIn;
        }

        if (_task) {
            task.repeat ?? (_task.repeat = task.repeat);
            task.end ?? (_task.end = task.end);
            task.data ?? (_task.data = task.data);

            // The modification of `start` and `timetable` will immediately
            // affect the task's schedule, so they need to be compared with the
            // original settings and only modify them when the settings are
            // mutated.
            if (String(_task["_timetable"]) !== String(task["_timetable"])) {
                _task["_timetable"] = task["_timetable"];
                _task.timetable = task.timetable;
            } else if (_task["_start"] !== task["_start"]) {
                _task["_start"] = task["_start"];
                _task.start = task.start;
            }
        } else {
            this.tasks.set(task.taskId, omit(task, ["startIn", "endIn"]));
        }

        return true;
    }

    /** Retrieves a specific task according to the taskId. */
    find(taskId: string): Promise<ScheduleTask>;
    /** Retrieves a list of tasks matched the queries (using mongodb syntax). */
    find<T>(query?: ScheduleQuery<T>): Promise<ScheduleTask[]>;
    async find(query: string | ScheduleQuery<any> = {}) {
        if (typeof query === "string") {
            return this.tasks.get(query);
        } else {
            query = { ...query };

            if (query.start && typeof query.start !== "number")
                query.start = timestamp(query.start);

            if (query.end && typeof query.end !== "number")
                query.end = timestamp(query.end);

            if (query.module && typeof query.module !== "string")
                query.module = String(query.module);

            return ([...this.tasks])
                .map(([, task]) => task)
                .filter(sift(<any>query));
        }
    }

    /** Deletes the specified task. */
    delete(taskId: string): Promise<boolean>;
    /** Deletes tasks that matched the queries (using mongodb syntax).  */
    delete<T>(query: ScheduleQuery<T>): Promise<number>;
    async delete(query: string | object) {
        if (typeof query === "string") {
            let task = this.tasks.get(query);

            if (task) {
                this.dispatch(task, "end");
                return true;
            } else {
                return false;
            }
        } else {
            let tasks = await this.find(query);
            let result = await Promise.all(
                tasks.map(task => this.delete(task.taskId))
            );

            return result.filter(Boolean).length;
        }
    }

    /**
     * Counts the size of the task pool, or specific tasks matched the queries
     * (using mongodb syntax).
     */
    async count<T>(query: ScheduleQuery<T> = void 0): Promise<number> {
        if (!query) {
            return this.tasks.size;
        } else {
            return (await this.find(query)).length;
        }
    }

    /** @deprecated use `find()` instead. */
    query(taskId: string): Promise<ScheduleTask>;
    query<T>(query?: ScheduleQuery<T>): Promise<ScheduleTask[]>;
    async query(query: any): Promise<any> {
        return this.find(query);
    }

    private isScheduleServer() {
        let servers = app.config.server.rpc || {};

        for (let id in servers) {
            let services = servers[id].services || [];
            if (id === app.id && services.includes(app.services.schedule)) {
                return true;
            }
        }

        return false;
    }

    /** @inner */
    async init() {
        this.state = "running";
        this.timer = setInterval(() => {
            let now = timestamp();

            this.tasks.forEach(task => {
                let { start, end, repeat, timetable } = task;
                let expired = !(!end || now < end);

                if (!expired) {
                    if (timetable) {
                        if (timetable.length === 0) {
                            expired = true;
                        } else {
                            // A reverse-ordered iteration is needed here since
                            // we want to check the timetable from the newest
                            // time to the oldest one.
                            for (let i = timetable.length; i--;) {
                                if (now >= timetable[i]) {
                                    this.dispatch(task);

                                    if (repeat) {
                                        timetable[i] = Number(timetable[i]) + repeat;
                                    } else {
                                        timetable.splice(i, 1);

                                        if (timetable.length === 0) {
                                            expired = true;
                                        }
                                    }

                                    break;
                                }
                            }
                        }
                    } else if (now >= start) {
                        this.dispatch(task);

                        if (repeat) {
                            task.start = now + repeat;
                        } else {
                            expired = true;
                        }
                    }
                }

                if (expired) {
                    this.dispatch(task, "end");
                }
            });
        }, 1000);

        if (app.config.saveSchedules) {
            try {
                let tasks: ScheduleTask[] = await fs.readJSON(this.filename);

                tasks.forEach(task => {
                    // compatible with old version
                    Array.isArray(task) && (task = task[1]);

                    this.tasks.set(task.taskId, task);
                });
            } catch (e) { }

            if (this.isScheduleServer()) {
                // Continuously flush tasks to disk file for backup.
                this.add({
                    taskId: "d41d8cd98f00b204e9800998ecf8427e", // empty string
                    appId: app.id,
                    start: timestamp() + 900, // in 15 minutes
                    repeat: 900, // every 15 minutes
                    module: app.services.schedule.name,
                    handler: "flush"
                });
            }
        }
    }

    /** @inner */
    async destroy(transferTasks = false) {
        if (this.state !== "running") {
            return;
        } else {
            this.state = "stopped";
        }

        clearInterval(this.timer);

        let isScheduleServer = this.isScheduleServer();
        let jobs: Promise<any>[] = [];

        this.tasks.forEach((task, taskId) => {
            if (transferTasks && !isScheduleServer) {
                this.tasks.delete(taskId);
                jobs.push(app.services.schedule(taskId).add(task));
            }
        });

        await Promise.all(jobs);

        if (app.config.saveSchedules && isScheduleServer) {
            await this.flush();
        }
    }

    /** @inner */
    async flush() {
        let tasks = [...this.tasks.values()].filter(task => {
            return task.taskId !== "d41d8cd98f00b204e9800998ecf8427e";
        });
        await fs.ensureDir(path.dirname(this.filename));
        await fs.writeJSON(this.filename, tasks);
    }

    private dispatch(task: ScheduleTask, type: "handle" | "end" = "handle") {
        let { taskId, appId, module, data } = task;
        let handle = type === "end" ? task.onEnd : task.handler;

        if (!handle) {
            if (type === "end") {
                app.message.publish(taskId + ".onEnd", data, [appId]);
            } else {
                app.message.publish(taskId, data, [appId]);
            }
        } else {
            app.message.publish(app.schedule.name, [
                module,
                handle,
                data
            ], [appId]);
        }

        // If an task is expired or canceled, remove it from the pool.
        if (type === "end") {
            this.tasks.delete(taskId);
        }
    }
}

export default ScheduleService;
