import { HttpController, route } from "sfn";

export default class extends HttpController {
    @route.get("/")
    async index() {
        await app.plugins.web.onView.invoke(this.req);
        return this.view("index");
    }

    @route.sse("/sse-test")
    *sseTest() {
        yield 1;
        yield 2;
        yield 3;
    }

    @route.get("/iterator-test")
    *test() {
        yield 1;
        yield 2;
        yield 3;
    }
}