import { HttpController, route } from "sfn";

export default class extends HttpController {
    @route.get("/")
    async index() {
        return this.view("index", {
            port: app.config.server.http.port
        });
    }
}