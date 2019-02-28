export interface ScheduleTask {
    serverId: string;
    taskId: string;
    timestamp: number;
    repeated: number;
    expired: boolean;
}

export interface ScheduleOptions {
    id: string;
    timestamp: number;
    handler: Function;
    repeated?: string;
}

export class Schedule {
    constructor(readonly name: string) { }

    create(options: ScheduleOptions): string {
        let { id, timestamp, handler, repeated } = options;
        let taskId = this.name + (id ? "." + id : "");

        app.message.unsubscribe(taskId);
        app.message.subscribe(taskId, handler);
        app.services.schedule.instance(taskId).add({
            taskId,
            repeated: Number(repeated),
            serverId: app.serverId,
            timestamp,
            expired: false
        });

        return taskId;
    }

    cancel(taskId: string) {
        return app.services.schedule.instance(taskId).delete(taskId);
    }

    run() {
        return app.services.schedule.instance(app.services.local).run();
    }

    stop() {
        return app.services.schedule.instance(app.services.local).stop();
    }
}

export default class ScheduleService {
    private timer: NodeJS.Timer;
    private tasks = new Map<string, ScheduleTask>();

    constructor(name: string) {
        this.add({
            serverId: app.serverId,
            taskId: "app.schedule",
            repeated: 1000 * 60 * 30,
            timestamp: Date.now(),
            expired: false
        });
    }

    run() {
        this.timer = setInterval(() => {
            let now = Date.now();

            for (let [taskId, task] of this.tasks) {
                if (!task.expired && now >= task.timestamp) {
                    if (taskId === "app.schedule" && task.serverId === app.serverId)
                        this.gc();
                    else
                        app.message.publish(taskId);

                    if (task.repeated)
                        task.timestamp += task.repeated;
                    else
                        task.expired = true;
                }
            }
        }, 1000);
    }

    stop() {
        clearInterval(this.timer);
    }

    private async gc() {
        for (let [taskId, task] of this.tasks) {
            if (task.expired) {
                this.tasks.delete(taskId);
            }
        }
    }

    add(task: ScheduleTask) {
        return this.tasks.set(task.taskId, task);
    }

    delete(taskId: string) {
        return this.tasks.delete(taskId);
    }
}