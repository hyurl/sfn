<!-- title: 定时任务; order: 17 -->
# 基本概念

自 0.5.x 版本起，SFN 引入了分布式的任务系统，并以微服务方式运行。要使用这个任务系统，
你需要创建一个或者多个 schedule 服务器程序，但无需担心，这依旧非常简单。

## 创建服务

### 配置

首先需要在配置文件中添加一项新的 RPC 服务器配置：

```typescript
// src/config.ts
export default <SFNConfig> {
    server: {
        rpc: {
            "schedule-server": {
                host: "localhost",
                port: 8001,
                modules: [app.services.schedule]
            }
        }
    }
}
```

（注：`app.services.schedule` 是一个框架内部集成的服务，你不需要编写这个服务的代码。）

### 编写程序入口

然后在 `src` 目录下新建一个程序入口文件，如 `schedule-server.ts`，其代码大概像这样：

```typescript
// src/schedule-server.ts
import "sfn";

app.rpc.serve("schedule-server");
```

然后编译，并执行命令 `node dist/schedule-server` 即可启动服务。

## 创建定时任务

你可以在任何地方，使用 `app.schedule.create()` 方法来创建定时任务。

```typescript
app.schedule.create({
    taskId: "my-schedule-1",
    start: Date.now() + 5000,
}, async () => {
    // do every thing in here after 5 seconds.
});

app.schedule.create({
    taskId: "my-schedule-2",
    start: moment().add(5, "minutes").valueOf() // using moment library
    repeat: 5000, // running repeatedly every 5 seconds
    end: momen().add(1, "hour").valueOf() // stops after 1 hour
}, async () => {
    // ...
});
```

如果你想要取消一个定时任务，只需要调用 `app.schedule.cancel()` 方法即可。

```typescript
app.schedule.cancel("my-schedule-1");
```

### 关于 taskId

你必须为每一个定时任务设置一个独立却又能预知的 `taskId`，框架这样设计的目的是为了在任何
一个模块被热重载的时候，里面创建的定时任务在被重复创建时，后者能覆盖前者，而不会因为
热重载导致系统中存在重复的任务。