<!-- title: ScheduleService; order: 5 -->

## ScheduleService

A distributed schedule service, runs as a micro-service.

This class is not intended to be called in user code, use `app.services.schedule`
instead.

## 方法

### find

- Retrieves a specific task according to the taskId.

```ts
find(taskId: string): Promise<ScheduleTask>;
```

- Retrieves a list of tasks matched the queries (using mongodb syntax).

```ts
find<T>(query?: ScheduleQuery<T>): Promise<ScheduleTask[]>;
```

### delete

- Deletes the specified task according to the taskId.

```ts
delete(taskId: string): Promise<boolean>;
```

- Deletes tasks that matched the queries (using mongodb syntax), returns the
    number of tasks that has been deleted.

```ts
delete<T>(query: ScheduleQuery<T>): Promise<number>;
```

### count

Counts the size of the task pool, or specific tasks matched the queries (using
mongodb syntax).

```ts
count<T>(query: ScheduleQuery<T> = void 0): Promise<number>;
```

## ScheduleTask

```ts
interface ScheduleTask extends ScheduleOptions {
    appId: string;
    taskId: string;
    module?: string;
    handler?: string;
    onEnd?: string;
    data?: any[];
}
```

## ScheduleQuery

```ts
// SiftQuery comes from package 'sift'
type ScheduleQuery<T> = Partial<SiftQuery> & {
    appId?: string | RegExp;
    taskId?: string | RegExp;
    start?: string | number | Date;
    end?: string | number | Date;
    repeat?: number;
    module?: ModuleProxy<T> | string | RegExp;
    handler?: MethodNameOf<T> | RegExp;
    onEnd?: MethodNameOf<T> | RegExp;
};
```
