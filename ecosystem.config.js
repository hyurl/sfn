module.exports = {
    apps: [
        {
            name: "web-server",
            script: "dist/index.js",
            exec_mode: "cluster",
            instances: "max",
            wait_ready: true,
            timeout: 5000,
            out_file: __dirname + "/logs/web-server-stdout.log",
            error_file: __dirname + "/logs/web-server-stderr.log",
        }
    ]
};