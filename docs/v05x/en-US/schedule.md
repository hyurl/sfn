<!-- title: Schedule; order: 17 -->
# Concept

Since version 0.5.x, SFN introduced a new distributed schedule system, and run 
as micro-service. To use this system, you have to create one or more schedule 
server process, but don't worry, it still easy in hand as usual.

## Create Service

### Configuration

First, add a new item of RPC server in the config file.

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

(NOTE: `app.services.schedule`) is a built-in service of the framework, you 
don't have to write any code of this service.)

### Write a Entry File

Now create a new entry file in `src` directory, say, `schedule-server.ts`, its
code should be like this:

```typescript
// src/schedule-server.ts
import "sfn";

app.rpc.serve("schedule-server");
```

Then compile and run the command `node dist/schedule-server` to start the 
service.

## Create Schedule Task

You can use the method `app.schedule.create()` to create schedule tasks anywhere
you want.

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

If you want to cancel a task, just call the method `app.schedule.cancel()` to do
so.

```typescript
app.schedule.cancel("my-schedule-1");
```

### About taskId

You have to set a unique but predictable `taskId` for every schedule task, the 
reason why the framework is designed in this way is that, after any module that
has been hot-reloaded, and the tasks created inside it is duplicated, the later
ones can substitute the former ones, so that there would not be duplicated tasks 
due to hot-reloading of the system. 