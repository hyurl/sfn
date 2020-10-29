<!-- title: Schedule; order: 4 -->

## Schedule

The very class used to create `app.schedule`, this class is not intended to be
called in user code, use `app.schedule` instead.

## Properties

- `name` \<string\> will always be `app.schedule`.

## Methods

### create

Creates a new schedule task according to the options and returns the task ID.

NOTE: the minimum tick interval of the schedule service is `1000`ms. 

NOTE: prior to v1.0, this function allow running asynchronously and return the
task ID without await, but now it always returns a promise and must be awaited
in order to get the task ID.

```ts
create<F extends TaskHandler>(
    options: BaseTaskOptions<F>,
    handler: F
): Promise<string>;
create<F extends TaskHandler>(options: FunctionTaskOptions<F>): Promise<string>;
create<T, M extends MethodNameOf<T>>(
    options: ModuleTaskOptions<T, M>
): Promise<string>;
```

where `TaskHandler` is

```ts
type TaskHandler = (...data: any[]) => void | Promise<void>;
```

### cancel

Cancels a task according to the given task ID.

```ts
cancel(taskId: string): Promise<boolean>;
```

## ScheduleOptions

```ts
interface ScheduleOptions {
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
```

## BaseTaskOptions

```ts
interface BaseTaskOptions<F extends TaskHandler> extends ScheduleOptions {
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
```

## FunctionTaskOptions

```ts
interface FunctionTaskOptions<F extends TaskHandler> extends BaseTaskOptions<F> {
    handler?: F;
    onEnd?: (...data: Parameters<F>) => void | Promise<void>;
}
```

## ModuleTaskOptions

```ts
interface ModuleTaskOptions<T, M extends MethodNameOf<T>> extends BaseTaskOptions<T[M]> {
    module?: ModuleProxy<T>;
    handler?: M;
    onEnd?: MethodNameOf<T>;
}
```
