<!-- title: Multi-Processing; order: 16 -->
# Concept

In history versions, SFN provided its own multi-process and communication module,
but since version 0.3.0, SFN uses [PM2](https://pm2.io) as its load-balancer, so
multi-processing now based on PM2. Normally, you just use the cluster mode that
PM2 provides, and it's okay.

```sh
pm2 start dist/index.js -i max
```

The above command will, according to to your machine condition, start proper 
numbers of process to provide the best load-balance performance. 

Moreover, the core modules of SFN are well designed suiting multi-processing 
scenario, so generally you don't need to worry concurrency control issues that 
may be brought by multi-processing programming. All is as simple as 
single-processing.

PM2 provides many useful tools that allow you managing your application in ease,
you should go to the official website and learn more about how to use them. 

## Inter-Process Communication

Although PM2 provides it's own IPC communication solution, but it's highly not
recommended using it in an SFN application, because it relies on the 
**child_process** module, which might break down the application during 
development progress when not using PM2.

To communicate between your processes in SFN, you'll have to use 
[ipchannel](https://github.com/hyurl/ipchannel) module, which is the only IPC 
package designed working both in single-processing and multi-processing scenario,
meaning even you're not under PM2, the logic you designed will still work.

```typescript
import channel from "ipchannel";

// listening messages without event
channel.on("message", (sender, msg) => {
    console.log(`Peer ${sender} says: ${msg}`);
});

// By default, the channel is not connnected immediately, and `channel.pid` 
// (peer id) will only be available after the connection is established, so the 
// following code will output undefined since the channel is not open yet.
console.log(channel.pid); // => undefined

// If you check `channel.connected`, it will be false initially.
console.log(channel.connected); // => false

// Even the channel is not yet connected, you still can send messages now, they
// will be queued and flushed once the connection is established.
channel.to(1).send("This message is sent before connection.");

channel.on("connect", () => {
    // now that channel is connected
    console.log(channel.connected); // => true

    switch (channel.pid) {
        case 1:
            // listening messages with a custom event
            channel.on("custom-event", (sender, ...data) => {
                console.log(`Peer ${sender} emits: ${JSON.stringify(data)}`);
            });
            break;

        case 2:
            // send message to peer 1
            channel.to(1).send("Hi peer 1, I'm peer 2.");
            break;

        case 3:
            // send message with an event to peer 1
            channel.to(1).emit("custom-event", "hello world");
            break;

        case 4:
            // send message to all peers
            channel.to("all").send("all attention");
            // send message with an event to all peers
            channel.to("all").emit("custom-event", "all attention");
            break;
    }
});
```