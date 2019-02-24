import { HttpController, route } from "sfn";

export default class extends HttpController {
    @route.get("/")
    async index() {
        await app.plugins.web.onView.call(this.req);
        return this.view("index", {
            port: app.config.server.http.port
        });
    }
}