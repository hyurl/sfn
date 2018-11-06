import { HttpController, Request, route } from "sfn";

/**
 * The Home controller is a special controller, it handles requests which 
 * visit the home page of the website through `GET /`.
 */
export default class extends HttpController {

    @route("GET /")
    index(req: Request) {
        return this.view("index", {
            title: "Service Framework for Node.js",
            protocol: req.protocol,
            host: req.headers.host
        });
    }

    /**
     * @example new EventSource("/sse-test")
     */
    @route("SSE /sse-test")
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