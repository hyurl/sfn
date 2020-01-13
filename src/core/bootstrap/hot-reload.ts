import { isCli } from '../../init';

// hot-reloading
app.hooks.lifeCycle.startup.bind(() => {
    if (!isCli && app.config.watch && app.config.watch.length > 0) {
        for (let item of app.config.watch) {
            if (typeof item.watch === "function") {
                item.watch();
            }
        }
    }
});