<!-- title: 定时任务; order: 17 -->
## 基本概念

自 0.5.x 版本起，SFN 引入了分布式的任务系统，并以微服务方式运行。要使用这个任务
系统，你需要创建一个或者多个 schedule 服务器程序，但无需担心，这依旧非常简单。

v0.6 版本修改了三处 `app.schedule` 接口的细节：

1. 使用 md5 字符串来作为任务 ID
2. 时间单位修改为秒
3. `data` 属性修改为一个数组以便能够传输多个参数到处理器函数中。

## 创建服务器

### 配置

首先需要在配置文件中添加一项新的 RPC 服务器配置：

```typescript
// src/config.ts
export default <app.Config> {
    server: {
        rpc: {
            "schedule-server": {
                host: "localhost",
                port: 8001,
                services: [app.services.schedule]
            }
        }
    }
}
```

（注：`app.services.schedule` 是一个框架内部集成的服务，你不需要编写这个服务的代码。）

### 启动服务器

```sh
node dist schedule-server
```

## 创建定时任务

你可以在任何地方，使用 `app.schedule.create()` 方法来创建定时任务。

```typescript
var taskId = app.schedule.create({
    salt: "my-schedule-1",
    start: moment().unix() + 5,
}, async () => {
    // do every thing in here after 5 seconds.
});

var taskId2 = app.schedule.create({
    salt: "my-schedule-2",
    start: moment().add(5, "minutes").unix() // using moment library
    repeat: 5, // running repeatedly every 5 seconds
    end: momen().add(1, "hour").unix() // stops after 1 hour
}, async () => {
    // ...
});

var taskId3 = app.schedule.create({
    salt: "my-schedule-3",
    timetable: ["18:00", "19:00", "20:00"] // using timetable
}, async () => {
    // ...
});
```

如果你想要取消一个定时任务，只需要调用 `app.schedule.cancel()` 方法即可。

```typescript
app.schedule.cancel(taskId);
```

### 关于 salt

推荐为每一个定时任务设置一个独立却又能预知的 `salt`，框架这样设计的目的是为了在
任何一个模块被热重载的时候，里面创建的定时任务在被重复创建时，后者能覆盖前者，而
不会因为热重载导致系统中存在重复的任务。

## 将模块绑定到定时任务

除了在创建任务时提供一个可执行的回调函数，你还可以将一个模块和方法绑定为定时任务
的处理器函数，这样做可以享受额外的好处，例如，即使服务器重启了，定时任务依旧可以
恢复运行。

```typescript
// services/someService.ts
declare global {
    namespace app {
        namespace services {
            const myService: ModuleProxy<MyService>;
        }
    }
}

export default class MyService {
    async syncDataEveryDay() {
        // ...
    }
}

var taskId = app.schedule.create({
    start: moment().unix(),
    repeat: 3600 * 24,
    module: app.services.myService,
    handler: "syncDataEveryDay"
});
```

## 传递数据到定时任务的处理器函数中

可以在创建定时任务时，设置 `data` 选项来在每一次调用处理器函数时，将其传递到函数
中，但需要注意的是，数据将会被转换为 JSON 来在服务进程之间传递，所有不支持 JSON 
化的数据都将会丢失；并且，数据一经设置将不能被改变。

```typescript
export default class MyService {
    async syncDataEveryDay(data: { foo: any }) {
        // ...
    }
}

var taskId = app.schedule.create({
    start: moment().unix(),
    repeat: 3600 * 24,
    module: app.services.myService,
    handler: "syncDataEveryDay",
    data: [{ foo: "Hello, World!" }]
});
```