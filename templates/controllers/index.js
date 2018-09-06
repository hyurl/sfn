const { HttpController } = require("sfn");

/**
 * The Home controller is a special controller, it handles requests which 
 * visit the home page of the website through `GET /`.
 */
exports.default = class extends HttpController {

    /** @route GET / */
    index() {
        let { req } = this;
        return this.view("index", {
            title: "Service Framework for Node.js",
            protocol: req.protocol,
            host: req.headers.host
        });
    }

    /**
     * @route SSE /sse-test
     * @example new EventSource("/sse-test")
     */
    sseTest() {
        var count = 0;
        var timer = setInterval(() => {
            count += 1;
            this.sse.send("Message from SSE: " + count);
            if (count == 10) {
                clearInterval(timer);
                this.sse.close();
            }
        }, 1000);
    }
}