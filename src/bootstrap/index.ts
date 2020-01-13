import "./load-docs";
import "./rpc-config";

app.config.watch = [
    app.controllers,
    app.hooks,
    app.locales,
    app.models,
    app.services,
    app.utils,
    app.views,
    app.docs
];