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

## Communications Between Workers And Master

PM2 also provides a simple solution for IPC, SFN currently adopts this approach,
to replace the original way that SFN provided. But the way PM2 provides may seem
a little ancient and bother, however, SFN is planning to introduce a better,
more friendly and much simpler way to communicate between processes.