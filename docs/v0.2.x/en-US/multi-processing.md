<!-- title: Multi-Processing; order: 16 -->
# Concept

An **SFN** application will start at least two processes, a master and a worker.
The master hosts all the workers, but itself doesn't start any server, the 
worker will start servers and listen ports.

## How To Use?

It is very simple to turn on more workers, just edit your `config.ts` file, 
set `workers` an array that carries several names, e.g. `["A", "B", "C"]`, which
will start three workers, A, B and C.

```typescript
export const config: SFNConifg = {
    // ...
    workers: ["A", "B", "C"],
    //...
};
```

In production environment, you should at least start two workers, in case one of
them is down or being rebooted (e.g. when running command `sfn reload`), the 
client will temporarily lost the connection to the server.

## Communications Between Workers And Master

Multi-processing in **SFN** is backed by 
[sfn-worker](https://github.com/hyurl/sfn-worker), it provides a very 
easy-to-use, however efficient way that allows you send and receive messages 
from one worker to another, or to/from the master, please go learn it if you 
have any specific needs.