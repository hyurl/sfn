module.exports = {
    apps: [{
        name: "web-server",
        script: "dist/index.js",
        instances: "max",
        exec_mode: "cluster"
    },
    {
        name: "doc-server",
        script: "dist/doc-server.js"
    }, {
        name: "schedule-server",
        script: "dist/schedule-server.js"
    }]
};