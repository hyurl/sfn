import { HttpController, route, throttle } from "sfn";

export default class extends HttpController {
    @route.get("/")
    @throttle("index", 1000)
    async index() {
        await app.hooks.web.onView.invoke(this.req);
        return this.view("index");
    }

    @route.sse("/sse-test")
    async *sseTest() {
        for await (let result of app.services.test.instance().asyncIterator()) {
            yield result;
        }

        this.sse.close();
    }

    @route.get("/iterator-test")
    async *test() {
        for await (let result of app.services.test.instance().asyncIterator()) {
            yield result;
        }
    }
}