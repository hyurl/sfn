module.exports = {
    apps: [
        {
            name: "doc-server",
            script: "dist/index.js",
            args: "doc-server",
            wait_ready: true,
            timeout: 5000,
            out_file: __dirname + "/logs/doc-server-stdout.log",
            error_file: __dirname + "/logs/doc-server-stderr.log",
        },
        {
            name: "logger-server",
            script: "dist/index.js",
            args: "logger-server",
            wait_ready: true,
            timeout: 5000,
            out_file: __dirname + "/logs/logger-server-stdout.log",
            error_file: __dirname + "/logs/logger-server-stderr.log",
        },
        {
            name: "schedule-server",
            script: "dist/index.js",
            args: "schedule-server",
            wait_ready: true,
            timeout: 5000,
            out_file: __dirname + "/logs/schedule-server-stdout.log",
            error_file: __dirname + "/logs/schedule-server-stderr.log",
        },
        {
            name: "cache-server",
            script: "dist/index.js",
            args: "cache-server",
            wait_ready: true,
            timeout: 5000,
            out_file: __dirname + "/logs/cache-server-stdout.log",
            error_file: __dirname + "/logs/cache-server-stderr.log",
        },
        {
            name: "web-server",
            script: "dist/index.js",
            exec_mode: "cluster",
            instances: -1,
            wait_ready: true,
            timeout: 5000,
            out_file: __dirname + "/logs/web-server-stdout.log",
            error_file: __dirname + "/logs/web-server-stderr.log",
        }
    ]
};