import { HttpController, route } from "sfn";

export default class extends HttpController {
    @route.get("/")
    async index() {
        return this.throttle(this.req.url, async () => {
            await app.hooks.web.onView.invoke(this.req);
            return this.view("index");
        }, 1000);
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