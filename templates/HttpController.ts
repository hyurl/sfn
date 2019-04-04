import { HttpController, Request, Response, route } from "sfn";

export default class extends HttpController {
    @route.get("/{name}/")
    index(req: Request, res: Response) {
        // ...
    }

    @route.post("/{name}")
    async create(req: Request, res: Response) {
        // ...
    }

    @route.get("/{name}/:id")
    async get(req: Request, res: Response) {
        // ...
    }

    @route.patch("/{name}/:id")
    async update(req: Request, res: Response) {
        // ...
    }

    @route.delete("/{name}/:id")
    async delete(req: Request, res: Response) {
        // ...
    }
}